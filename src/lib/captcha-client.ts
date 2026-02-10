/**
 * Client-side CAPTCHA utilities
 */

interface CaptchaConfig {
  enabled: boolean;
  provider: string;
  siteKey: string | null;
}

let cachedConfig: CaptchaConfig | null = null;
let configPromise: Promise<CaptchaConfig> | null = null;

/**
 * Fetch CAPTCHA configuration from the server
 */
export async function getCaptchaConfig(): Promise<CaptchaConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Return existing promise if already fetching
  if (configPromise) {
    return configPromise;
  }

  // Fetch config from API
  configPromise = fetch("/api/auth/captcha-config")
    .then(async (response) => {
      if (!response.ok) {
        // If API fails, assume CAPTCHA is disabled
        return {
          enabled: false,
          provider: "hcaptcha",
          siteKey: null,
        };
      }
      const data = await response.json();
      cachedConfig = data;
      return data;
    })
    .catch(() => {
      // On error, assume CAPTCHA is disabled
      return {
        enabled: false,
        provider: "hcaptcha",
        siteKey: null,
      };
    });

  return configPromise;
}

/**
 * Clear the cached config (useful for testing)
 */
export function clearCaptchaConfigCache(): void {
  cachedConfig = null;
  configPromise = null;
}

/**
 * Check if CAPTCHA is enabled on the client side
 */
export async function isCaptchaEnabled(): Promise<boolean> {
  const config = await getCaptchaConfig();
  return config.enabled;
}
