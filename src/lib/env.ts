import { z } from "zod";

/**
 * Environment validation schema with Zod
 * - Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
 * - Optional: REDIS_URL, API keys
 * Fails fast at startup if required vars missing
 */

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url().describe("PostgreSQL database URL"),
  NEXTAUTH_SECRET: z.string().min(32).describe("NextAuth secret (min 32 chars)"),
  NEXTAUTH_URL: z.string().url().describe("NextAuth callback URL"),

  // Email (Required for production)
  RESEND_API_KEY: z
    .string()
    .min(1)
    .optional()
    .describe("Resend API key for email service"),
  EMAIL_FROM: z
    .string()
    .email()
    .default("onboarding@resend.dev")
    .describe("Default sender email address"),

  // Optional (with sensible defaults)
  REDIS_URL: z
    .string()
    .url()
    .optional()
    .describe("Redis URL for caching and rate limiting"),
  OPENAI_API_KEY: z
    .string()
    .optional()
    .describe("OpenAI API key for AI features"),
  GROQ_API_KEY: z
    .string()
    .optional()
    .describe("Groq API key for AI chat features"),
  GOOGLE_PLACES_API_KEY: z
    .string()
    .optional()
    .describe("Google Places API key for location features"),
  GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .describe("Google OAuth client ID"),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .optional()
    .describe("Google OAuth client secret"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .describe("Public app URL"),

  // Node env
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Security: PHI Encryption (required for production)
  ENCRYPTION_KEY: z
    .string()
    .length(64)
    .optional()
    .describe("64-char hex key for PHI encryption (AES-256-GCM)"),

  // Security: CAPTCHA (optional)
  CAPTCHA_PROVIDER: z
    .enum(["hcaptcha", "recaptcha"])
    .optional()
    .describe("CAPTCHA provider for form protection"),
  CAPTCHA_SECRET_KEY: z
    .string()
    .optional()
    .describe("CAPTCHA secret key for server-side verification"),
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: z
    .string()
    .optional()
    .describe("CAPTCHA site key for client-side widget"),
  CAPTCHA_MIN_SCORE: z
    .string()
    .default("0.5")
    .describe("Minimum score for reCAPTCHA v3"),

  // Security: MFA (optional)
  MFA_ISSUER_NAME: z
    .string()
    .default("NeuroKid")
    .describe("MFA issuer name shown in authenticator apps"),

  // Security: Sentry (optional)
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe("Sentry DSN for error tracking"),
  SENTRY_ENVIRONMENT: z
    .string()
    .default("production")
    .describe("Sentry environment tag"),
  SENTRY_TRACES_SAMPLE_RATE: z
    .string()
    .default("0.1")
    .describe("Sentry performance tracing sample rate"),

  // Security: Webhook (optional)
  SECURITY_WEBHOOK_URL: z
    .string()
    .url()
    .optional()
    .describe("Security events webhook URL for SIEM integration"),

  // Security: Dev Login (development only)
  ALLOW_DEV_LOGIN_WITHOUT_DB: z
    .enum(["true", "false"])
    .default("false")
    .describe("Allow development login without database"),
  DEV_AUTH_EMAIL: z
    .string()
    .email()
    .optional()
    .describe("Development login email"),
  DEV_AUTH_PASSWORD_HASH: z
    .string()
    .optional()
    .describe("Bcrypt hash of development login password"),
  DEV_AUTH_ROLES: z
    .string()
    .default("PARENT")
    .describe("Comma-separated roles for dev login"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * Validates on first call, then returns cached result
 */
export function getEnv(): Env {
  if (validatedEnv) return validatedEnv;

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.code === "invalid_type" || e.code === "too_small")
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n  ");

      console.error(
        "❌ Environment validation failed:\n  " + missingVars + "\n"
      );
      throw new Error(
        "Missing required environment variables. See details above."
      );
    }
    throw error;
  }
}

/**
 * Validate optional variables gracefully
 * Returns undefined if not set, doesn't crash
 */
export function getOptionalEnv<T extends keyof Env>(key: T): Env[T] | undefined {
  const env = getEnv();
  return env[key] as Env[T] | undefined;
}

/**
 * Check if Redis is available (safe to use in features)
 */
export function isRedisAvailable(): boolean {
  try {
    const env = getEnv();
    return !!env.REDIS_URL;
  } catch {
    return false;
  }
}

/**
 * Check if AI features are enabled (OpenAI or Groq)
 */
export function isAIEnabled(): boolean {
  try {
    const env = getEnv();
    return !!(env.OPENAI_API_KEY || env.GROQ_API_KEY);
  } catch {
    return false;
  }
}

/**
 * Check if Groq AI is configured
 */
export function isGroqEnabled(): boolean {
  try {
    return !!getEnv().GROQ_API_KEY;
  } catch {
    return false;
  }
}

/**
 * Check if Google Places API is configured
 */
export function isGooglePlacesEnabled(): boolean {
  try {
    return !!getEnv().GOOGLE_PLACES_API_KEY;
  } catch {
    return false;
  }
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleOAuthEnabled(): boolean {
  try {
    const env = getEnv();
    return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  } catch {
    return false;
  }
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  try {
    const env = getEnv();
    return !!env.RESEND_API_KEY && env.RESEND_API_KEY.startsWith('re_');
  } catch {
    return false;
  }
}

/**
 * Get email configuration status for health checks
 */
export function getEmailConfigStatus(): { 
  configured: boolean; 
  fromAddress: string;
  apiKeyPrefix: string | null;
} {
  try {
    const env = getEnv();
    const apiKey = env.RESEND_API_KEY;
    return {
      configured: !!apiKey && apiKey.startsWith('re_'),
      fromAddress: env.EMAIL_FROM,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 7)}...` : null,
    };
  } catch {
    return {
      configured: false,
      fromAddress: 'not-configured',
      apiKeyPrefix: null,
    };
  }
}

/**
 * SECURITY: Validate that server-only secrets are never exposed
 * This function should be called in server-side code only
 * Returns true if all secret keys are properly secured
 */
export function validateSecretSecurity(): { secure: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check that sensitive env vars are NOT prefixed with NEXT_PUBLIC_
  const sensitiveKeys = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'OPENAI_API_KEY',
    'GROQ_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_CLIENT_SECRET',
    'REDIS_URL'
  ];

  for (const key of sensitiveKeys) {
    const publicKey = `NEXT_PUBLIC_${key}`;
    if (process.env[publicKey]) {
      issues.push(`SECURITY RISK: ${publicKey} should NOT be prefixed with NEXT_PUBLIC_. This exposes secrets to the client!`);
    }
  }

  return {
    secure: issues.length === 0,
    issues
  };
}

// Validate env on module load (fail fast on server-side only)
if (typeof window === "undefined" && typeof process !== "undefined") {
  try {
    getEnv();

    // Security check: Ensure secrets are not exposed
    const securityCheck = validateSecretSecurity();
    if (!securityCheck.secure) {
      console.error("⚠️ SECURITY ISSUES DETECTED:");
      securityCheck.issues.forEach(issue => console.error(`  - ${issue}`));
    }
  } catch (error) {
    // Only log; don't call process.exit in modules that might run in Edge Runtime
    console.error("Failed to load environment variables:", error);
  }
}
