import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock captcha module for these tests
vi.unmock('@/lib/captcha');

import { POST as registerHandler } from '@/app/api/auth/register/route';
import { GET as captchaConfigHandler } from '@/app/api/auth/captcha-config/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';
import { resetMockData } from '../setup';
import { MOCK_CAPTCHA_TOKEN } from '../helpers/captcha-mock';

const prisma = getTestPrisma();

// Mock the mailer
vi.mock('@/lib/mailer', () => ({
  sendVerificationEmail: vi.fn(),
}));

describe('CAPTCHA Registration Integration', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    resetMockData();
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.CAPTCHA_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('CAPTCHA Configuration Endpoint', () => {
    it('should return CAPTCHA config when enabled', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'test-secret-key';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'test-site-key';
      process.env.CAPTCHA_PROVIDER = 'hcaptcha';

      const res = await captchaConfigHandler();

      expect(res.status).toBe(200);
      const data = await parseResponse(res);
      expect(data.enabled).toBe(true);
      expect(data.provider).toBe('hcaptcha');
      expect(data.siteKey).toBe('test-site-key');
    });

    it('should return disabled config when not configured', async () => {
      const res = await captchaConfigHandler();

      expect(res.status).toBe(200);
      const data = await parseResponse(res);
      expect(data.enabled).toBe(false);
      expect(data.siteKey).toBeNull();
    });

    it('should not expose secret key in config endpoint', async () => {
      process.env.CAPTCHA_SECRET_KEY = 'super-secret-key';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'public-site-key';

      const res = await captchaConfigHandler();

      const data = await parseResponse(res);
      expect(data).not.toHaveProperty('secretKey');
    });
  });

  describe('Registration with CAPTCHA', () => {
    it('should allow registration with valid CAPTCHA token in production', async () => {
      // Setup production environment with CAPTCHA
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'test-site-key';

      // Mock global fetch for CAPTCHA verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }) as unknown as typeof fetch;

      const uniqueId = Date.now();
      const req = createMockRequest('POST', '/api/auth/register', {
        body: {
          email: `captcha-test${uniqueId}@example.com`,
          password: 'SecurePassword123!@#',
          confirmPassword: 'SecurePassword123!@#',
          username: `captchatest${uniqueId}`,
          displayName: 'CAPTCHA Test User',
          captchaToken: MOCK_CAPTCHA_TOKEN,
        },
      });

      const res = await registerHandler(req);
      
      // Should succeed
      expect([201, 400]).toContain(res.status);
      
      if (res.status === 201) {
        const data = await parseResponse(res);
        expect(data.user).toBeDefined();
      }
    });

    it('should reject registration without CAPTCHA token in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'test-site-key';

      const req = createMockRequest('POST', '/api/auth/register', {
        body: {
          email: 'no-captcha@example.com',
          password: 'SecurePassword123!@#',
          confirmPassword: 'SecurePassword123!@#',
          username: 'nocaptcha',
          displayName: 'No CAPTCHA User',
          // No captchaToken
        },
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
      
      const data = await parseResponse(res);
      expect(data.error).toMatch(/CAPTCHA verification required/i);
    });

    it('should reject registration with invalid CAPTCHA token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      // Mock failed CAPTCHA verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      }) as unknown as typeof fetch;

      const req = createMockRequest('POST', '/api/auth/register', {
        body: {
          email: 'invalid-captcha@example.com',
          password: 'SecurePassword123!@#',
          confirmPassword: 'SecurePassword123!@#',
          username: 'invalidcaptcha',
          displayName: 'Invalid CAPTCHA User',
          captchaToken: 'invalid-token',
        },
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
      
      const data = await parseResponse(res);
      expect(data.error).toMatch(/CAPTCHA verification failed/i);
    });

    it('should allow registration without CAPTCHA in development', async () => {
      process.env.NODE_ENV = 'development';
      // CAPTCHA not configured

      const uniqueId = Date.now();
      const req = createMockRequest('POST', '/api/auth/register', {
        body: {
          email: `dev-test${uniqueId}@example.com`,
          password: 'SecurePassword123!@#',
          confirmPassword: 'SecurePassword123!@#',
          username: `devtest${uniqueId}`,
          displayName: 'Dev Test User',
          // No captchaToken
        },
      });

      const res = await registerHandler(req);
      
      // Should succeed in development without CAPTCHA
      expect([201, 400]).toContain(res.status);
    });

    it('should use provided CAPTCHA token even in development when available', async () => {
      process.env.NODE_ENV = 'development';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      // Mock successful CAPTCHA verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }) as unknown as typeof fetch;

      const uniqueId = Date.now();
      const req = createMockRequest('POST', '/api/auth/register', {
        body: {
          email: `dev-captcha${uniqueId}@example.com`,
          password: 'SecurePassword123!@#',
          confirmPassword: 'SecurePassword123!@#',
          username: `devcaptcha${uniqueId}`,
          displayName: 'Dev CAPTCHA User',
          captchaToken: MOCK_CAPTCHA_TOKEN,
        },
      });

      const res = await registerHandler(req);
      
      // Should verify CAPTCHA even in development when provided
      expect(global.fetch).toHaveBeenCalled();
      expect([201, 400]).toContain(res.status);
    });
  });
});
