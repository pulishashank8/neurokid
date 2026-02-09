import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Unmock the captcha module for these tests
vi.unmock('@/lib/captcha');

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import the actual module
const { verifyCaptcha, isCaptchaConfigured, getCaptchaConfig, requireCaptcha } = await import('@/lib/captcha');

describe('CAPTCHA Server Library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('verifyCaptcha', () => {
    it('should return success when CAPTCHA is not configured', async () => {
      delete process.env.CAPTCHA_SECRET_KEY;

      const result = await verifyCaptcha('any-token');
      
      expect(result.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fail with missing token', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      const result = await verifyCaptcha('');
      
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-response');
    });

    it('should verify hCaptcha token successfully', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.CAPTCHA_PROVIDER = 'hcaptcha';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: 'localhost',
        }),
      });

      const result = await verifyCaptcha('valid-token');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hcaptcha.com/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should verify reCAPTCHA token successfully', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.CAPTCHA_PROVIDER = 'recaptcha';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: 'localhost',
        }),
      });

      const result = await verifyCaptcha('valid-token');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.any(Object)
      );
    });

    it('should check reCAPTCHA v3 score threshold', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.CAPTCHA_PROVIDER = 'recaptcha';
      process.env.CAPTCHA_MIN_SCORE = '0.7';

      // Low score should fail
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          score: 0.3,
          challenge_ts: new Date().toISOString(),
        }),
      });

      const result = await verifyCaptcha('low-score-token');
      
      expect(result.success).toBe(false);
      expect(result.score).toBe(0.3);
    });

    it('should pass reCAPTCHA v3 with high score', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.CAPTCHA_PROVIDER = 'recaptcha';
      process.env.CAPTCHA_MIN_SCORE = '0.5';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          score: 0.9,
          challenge_ts: new Date().toISOString(),
        }),
      });

      const result = await verifyCaptcha('high-score-token');
      
      expect(result.success).toBe(true);
      expect(result.score).toBe(0.9);
    });

    it('should handle verification API failure', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await verifyCaptcha('token');
      
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('verification-error');
    });

    it('should handle network errors', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyCaptcha('token');
      
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('verification-error');
    });

    it('should return error codes from provider', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          'error-codes': ['invalid-input-response', 'bad-request'],
        }),
      });

      const result = await verifyCaptcha('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('invalid-input-response');
      expect(result.errorCodes).toContain('bad-request');
    });
  });

  describe('isCaptchaConfigured', () => {
    it('should return true when both keys are set', () => {
      process.env.CAPTCHA_SECRET_KEY = 'secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'site-key';

      expect(isCaptchaConfigured()).toBe(true);
    });

    it('should return false when secret key is missing', () => {
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'site-key';
      delete process.env.CAPTCHA_SECRET_KEY;

      expect(isCaptchaConfigured()).toBe(false);
    });

    it('should return false when site key is missing', () => {
      process.env.CAPTCHA_SECRET_KEY = 'secret';
      delete process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

      expect(isCaptchaConfigured()).toBe(false);
    });

    it('should return false when both keys are missing', () => {
      delete process.env.CAPTCHA_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

      expect(isCaptchaConfigured()).toBe(false);
    });
  });

  describe('getCaptchaConfig', () => {
    it('should return complete config when configured', () => {
      process.env.CAPTCHA_PROVIDER = 'recaptcha';
      process.env.CAPTCHA_SECRET_KEY = 'secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'site-key';

      const config = getCaptchaConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('recaptcha');
      expect(config.siteKey).toBe('site-key');
    });

    it('should return disabled config when not configured', () => {
      delete process.env.CAPTCHA_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

      const config = getCaptchaConfig();

      expect(config.enabled).toBe(false);
      expect(config.siteKey).toBeNull();
    });

    it('should default to hcaptcha provider', () => {
      delete process.env.CAPTCHA_PROVIDER;
      process.env.CAPTCHA_SECRET_KEY = 'secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'site-key';

      const config = getCaptchaConfig();

      expect(config.provider).toBe('hcaptcha');
    });
  });

  describe('requireCaptcha middleware', () => {
    it('should allow request in development without config', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.CAPTCHA_SECRET_KEY;

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const result = await requireCaptcha(req);
      
      expect(result).toBeNull();
    });

    it('should reject request without token in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'secret';

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const result = await requireCaptcha(req);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
      
      const data = await result?.json();
      expect(data.error).toMatch(/CAPTCHA verification required/i);
    });

    it('should reject request with invalid token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'secret';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      });

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ captchaToken: 'invalid' }),
      });

      const result = await requireCaptcha(req);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });

    it('should allow request with valid token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'secret';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          challenge_ts: new Date().toISOString(),
        }),
      });

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ captchaToken: 'valid-token' }),
      });

      const result = await requireCaptcha(req);
      
      expect(result).toBeNull();
    });

    it('should handle invalid JSON body', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'secret';

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: 'not-json',
      });

      const result = await requireCaptcha(req);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });
  });
});
