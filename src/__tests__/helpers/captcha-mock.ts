/**
 * CAPTCHA Testing Utilities
 * 
 * Provides mock implementations and helpers for testing CAPTCHA functionality
 */

import { vi } from 'vitest';

// Mock CAPTCHA configuration
export const mockCaptchaConfig = {
  enabled: true,
  provider: 'hcaptcha',
  siteKey: '10000000-ffff-ffff-ffff-000000000001',
  secretKey: '0x0000000000000000000000000000000000000000',
};

// Mock token for testing
export const MOCK_CAPTCHA_TOKEN = 'mock-captcha-token-valid';
export const MOCK_CAPTCHA_TOKEN_INVALID = 'mock-captcha-token-invalid';

/**
 * Setup global CAPTCHA mocks for component testing
 */
export function setupCaptchaGlobalMocks(): void {
  // Mock window.hcaptcha
  Object.defineProperty(window, 'hcaptcha', {
    writable: true,
    value: {
      render: vi.fn().mockReturnValue('mock-widget-id'),
      reset: vi.fn(),
      remove: vi.fn(),
    },
  });

  // Mock window.grecaptcha
  Object.defineProperty(window, 'grecaptcha', {
    writable: true,
    value: {
      ready: vi.fn((callback: () => void) => callback()),
      render: vi.fn().mockReturnValue('mock-widget-id'),
      reset: vi.fn(),
      execute: vi.fn().mockResolvedValue(MOCK_CAPTCHA_TOKEN),
    },
  });
}

/**
 * Mock fetch for CAPTCHA config endpoint
 */
export function mockCaptchaConfigEndpoint(enabled = true): void {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/auth/captcha-config') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          enabled,
          provider: mockCaptchaConfig.provider,
          siteKey: enabled ? mockCaptchaConfig.siteKey : null,
        }),
      });
    }
    // Default response for other requests
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }) as unknown as typeof fetch;
}

/**
 * Create a mock CAPTCHA widget that simulates verification
 */
export function createMockCaptchaWidget(
  options: {
    shouldSucceed?: boolean;
    delay?: number;
  } = {}
): { render: () => void; simulateVerify: () => void; simulateExpire: () => void; simulateError: () => void } {
  const { shouldSucceed = true, delay = 100 } = options;

  let callback: ((token: string) => void) | null = null;
  let errorCallback: (() => void) | null = null;
  let expireCallback: (() => void) | null = null;

  return {
    render: () => {
      // Simulate the render process
      setTimeout(() => {
        // Widget is ready
      }, delay);
    },
    simulateVerify: () => {
      if (callback) {
        if (shouldSucceed) {
          callback(MOCK_CAPTCHA_TOKEN);
        } else {
          errorCallback?.();
        }
      }
    },
    simulateExpire: () => {
      expireCallback?.();
    },
    simulateError: () => {
      errorCallback?.();
    },
  };
}

/**
 * Mock the captcha-client module
 */
export function mockCaptchaClient(enabled = true): void {
  vi.mock('@/lib/captcha-client', () => ({
    getCaptchaConfig: vi.fn().mockResolvedValue({
      enabled,
      provider: mockCaptchaConfig.provider,
      siteKey: enabled ? mockCaptchaConfig.siteKey : null,
    }),
    isCaptchaEnabled: vi.fn().mockResolvedValue(enabled),
    clearCaptchaConfigCache: vi.fn(),
  }));
}

/**
 * Mock the captcha server-side module
 */
export function mockCaptchaServer(shouldVerify = true): void {
  vi.mock('@/lib/captcha', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/captcha')>();
    return {
      ...actual,
      verifyCaptcha: vi.fn().mockResolvedValue({
        success: shouldVerify,
        challengeTs: new Date().toISOString(),
        hostname: 'localhost',
        errorCodes: shouldVerify ? undefined : ['invalid-input-response'],
      }),
      isCaptchaConfigured: vi.fn().mockReturnValue(true),
      getCaptchaConfig: vi.fn().mockReturnValue({
        enabled: true,
        provider: mockCaptchaConfig.provider,
        siteKey: mockCaptchaConfig.siteKey,
      }),
    };
  });
}

/**
 * Cleanup function to reset all CAPTCHA mocks
 */
export function cleanupCaptchaMocks(): void {
  vi.clearAllMocks();
  // Use type assertion to delete properties
  const win = window as Record<string, unknown>;
  delete win.hcaptcha;
  delete win.grecaptcha;
  delete win.onloadHCaptchaCallback;
  delete win.onloadReCaptchaCallback;
}

/**
 * Helper to wait for CAPTCHA widget to initialize
 */
export async function waitForCaptchaToLoad(timeout = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      if (window.hcaptcha || window.grecaptcha) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('CAPTCHA failed to load within timeout'));
      }
    }, 100);
  });
}
