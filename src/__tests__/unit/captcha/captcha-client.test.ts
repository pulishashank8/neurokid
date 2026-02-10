import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the captcha-client module for these tests
vi.unmock('@/lib/captcha-client');

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import the module functions after mocking fetch
const { getCaptchaConfig, isCaptchaEnabled, clearCaptchaConfigCache } = await import('@/lib/captcha-client');

describe('CAPTCHA Client Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCaptchaConfigCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCaptchaConfig', () => {
    it('should fetch config from API', async () => {
      const mockConfig = {
        enabled: true,
        provider: 'hcaptcha',
        siteKey: 'test-site-key',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      const config = await getCaptchaConfig();

      expect(config).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/captcha-config');
    });

    it('should cache config after first fetch', async () => {
      const mockConfig = {
        enabled: true,
        provider: 'hcaptcha',
        siteKey: 'test-site-key',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      // First call
      await getCaptchaConfig();
      
      // Second call should use cache
      const config = await getCaptchaConfig();

      expect(config).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return disabled config when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const config = await getCaptchaConfig();

      expect(config.enabled).toBe(false);
      expect(config.provider).toBe('hcaptcha');
      expect(config.siteKey).toBeNull();
    });

    it('should return disabled config on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const config = await getCaptchaConfig();

      expect(config.enabled).toBe(false);
      expect(config.provider).toBe('hcaptcha');
      expect(config.siteKey).toBeNull();
    });

    it('should deduplicate concurrent requests', async () => {
      const mockConfig = {
        enabled: true,
        provider: 'hcaptcha',
        siteKey: 'test-site-key',
      };

      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      // Start multiple concurrent requests
      const promise1 = getCaptchaConfig();
      const promise2 = getCaptchaConfig();
      const promise3 = getCaptchaConfig();

      // Resolve the fetch
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toEqual(mockConfig);
      expect(result2).toEqual(mockConfig);
      expect(result3).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('isCaptchaEnabled', () => {
    it('should return true when CAPTCHA is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          enabled: true,
          provider: 'hcaptcha',
          siteKey: 'test-site-key',
        }),
      });

      const enabled = await isCaptchaEnabled();

      expect(enabled).toBe(true);
    });

    it('should return false when CAPTCHA is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          enabled: false,
          provider: 'hcaptcha',
          siteKey: null,
        }),
      });

      const enabled = await isCaptchaEnabled();

      expect(enabled).toBe(false);
    });

    it('should return false on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const enabled = await isCaptchaEnabled();

      expect(enabled).toBe(false);
    });
  });

  describe('clearCaptchaConfigCache', () => {
    it('should clear cached config', async () => {
      const mockConfig1 = {
        enabled: true,
        provider: 'hcaptcha',
        siteKey: 'key-1',
      };

      const mockConfig2 = {
        enabled: true,
        provider: 'recaptcha',
        siteKey: 'key-2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig1),
      });

      // First fetch
      const config1 = await getCaptchaConfig();
      expect(config1.siteKey).toBe('key-1');

      // Clear cache
      clearCaptchaConfigCache();

      // Mock different response for second fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig2),
      });

      // Second fetch should get new data
      const config2 = await getCaptchaConfig();
      expect(config2.siteKey).toBe('key-2');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
