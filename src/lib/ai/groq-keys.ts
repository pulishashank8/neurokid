/**
 * Groq API Key Rotation
 *
 * Supports multiple keys via GROQ_API_KEYS (comma-separated) for automatic
 * round-robin rotation to distribute load and avoid per-key rate limits.
 *
 * Set either:
 * - GROQ_API_KEYS=key1,key2,key3,key4,key5 (multiple keys, rotated)
 * - GROQ_API_KEY=key1 (single key, backward compatible)
 */

const keys: string[] = (() => {
  const multi = process.env.GROQ_API_KEYS?.trim();
  if (multi) {
    return multi
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && k !== "mock-key");
  }
  const single = process.env.GROQ_API_KEY?.trim();
  if (single && single !== "mock-key") {
    return [single];
  }
  return [];
})();

let roundRobinIndex = 0;

/**
 * Get the next Groq API key using round-robin rotation.
 * Returns null if no keys are configured.
 */
export function getNextGroqKey(): string | null {
  if (keys.length === 0) return null;
  const key = keys[roundRobinIndex % keys.length];
  roundRobinIndex += 1;
  return key;
}

/**
 * Check if any Groq key is configured.
 */
export function hasGroqKeys(): boolean {
  return keys.length > 0;
}

/**
 * Number of keys available (for logging/debugging).
 */
export function getGroqKeyCount(): number {
  return keys.length;
}

/** Status codes that mean "try next API key" (429=rate limit/out of tokens, 5xx=overloaded) */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503]);

/**
 * Call Groq API with automatic retry on rate limit / overload.
 * When one key hits limit (429) or service error (502/503), tries the next key.
 * Set GROQ_API_KEYS=key1,key2,key3,key4,key5 for 5 keys rotation.
 */
export async function callGroqWithKeyRetry<T>(
  fetchFn: (apiKey: string) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>
): Promise<T> {
  const keyCount = keys.length;
  if (keyCount === 0) throw new Error("GROQ_API_KEY or GROQ_API_KEYS not configured");

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < keyCount; attempt++) {
    const apiKey = getNextGroqKey();
    if (!apiKey) break;

    try {
      const response = await fetchFn(apiKey);
      if (response.ok) {
        const data = await response.json();
        return data as T;
      }
      const shouldTryNext = RETRYABLE_STATUS_CODES.has(response.status) && attempt < keyCount - 1;
      if (shouldTryNext) {
        console.warn(`[Groq] Key ${attempt + 1}/${keyCount} limit/error (${response.status}), trying next key`);
        lastError = new Error(`Groq API key ${attempt + 1}/${keyCount} limit/error (${response.status}), trying next`);
        continue;
      }
      throw new Error(`Groq HTTP ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < keyCount - 1) continue;
      throw lastError;
    }
  }
  throw lastError || new Error("No Groq keys available");
}

/** Groq chat completions request options */
export interface GroqChatOptions {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

/** Groq chat completions response (subset we use) */
export interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Call Groq chat completions with key rotation + retry on 429.
 * Use this everywhere Groq API is called for consistency.
 */
export async function callGroqChat(options: GroqChatOptions): Promise<GroqChatResponse> {
  const { model = DEFAULT_MODEL, messages, temperature = 0.7, max_tokens = 1024 } = options;
  return callGroqWithKeyRetry<GroqChatResponse>(async (apiKey) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  });
}
