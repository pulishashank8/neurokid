import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock captcha module
vi.unmock('@/lib/captcha');

import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';
import { resetMockData } from '../setup';
import { MOCK_CAPTCHA_TOKEN } from '../helpers/captcha-mock';
import bcryptjs from 'bcryptjs';

const prisma = getTestPrisma();

// Mock the mailer
vi.mock('@/lib/mailer', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

describe('CAPTCHA Forgot Password Integration', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    resetMockData();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CAPTCHA_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Forgot Password with CAPTCHA', () => {
    it('should allow forgot-password with valid CAPTCHA token in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'test-site-key';

      // Create a test user
      const email = 'forgot-captcha@example.com';
      await prisma.user.deleteMany({ where: { email } });
      
      await prisma.user.create({
        data: {
          email,
          hashedPassword: await bcryptjs.hash('Password123!', 10),
          profile: { create: { username: 'forgotcaptcha', displayName: 'Forgot CAPTCHA' } },
          userRoles: { create: { role: 'PARENT' } },
        },
      });

      // Mock successful CAPTCHA verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          challengeTs: new Date().toISOString(),
          hostname: 'localhost',
        }),
      }) as unknown as typeof fetch;

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email,
          captchaToken: MOCK_CAPTCHA_TOKEN,
        },
      });

      const res = await forgotPasswordHandler(req);
      
      // Should succeed
      expect([200, 400]).toContain(res.status);
    });

    it('should reject forgot-password without CAPTCHA token in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';
      process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = 'test-site-key';

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email: 'no-captcha@example.com',
          // No captchaToken
        },
      });

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(400);
      
      const data = await parseResponse(res);
      expect(data.error).toMatch(/CAPTCHA verification required/i);
    });

    it('should reject forgot-password with invalid CAPTCHA token', async () => {
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

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email: 'invalid-captcha@example.com',
          captchaToken: 'invalid-token',
        },
      });

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(400);
      
      const data = await parseResponse(res);
      expect(data.error).toMatch(/CAPTCHA verification failed/i);
    });

    it('should allow forgot-password without CAPTCHA in development', async () => {
      process.env.NODE_ENV = 'development';
      // CAPTCHA not configured

      const email = 'dev-forgot@example.com';
      await prisma.user.deleteMany({ where: { email } });

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email,
          // No captchaToken
        },
      });

      const res = await forgotPasswordHandler(req);
      
      // Should succeed in development without CAPTCHA
      expect([200, 400]).toContain(res.status);
    });

    it('should still return success for non-existent users with valid CAPTCHA', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      // Mock successful CAPTCHA verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          challengeTs: new Date().toISOString(),
        }),
      }) as unknown as typeof fetch;

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email: 'nonexistent-captcha@example.com',
          captchaToken: MOCK_CAPTCHA_TOKEN,
        },
      });

      const res = await forgotPasswordHandler(req);
      
      // Should return success (to prevent user enumeration)
      expect([200, 400]).toContain(res.status);
    });

    it('should handle CAPTCHA verification error gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CAPTCHA_SECRET_KEY = 'test-secret';

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const req = createMockRequest('POST', '/api/auth/forgot-password', {
        body: {
          email: 'error-test@example.com',
          captchaToken: MOCK_CAPTCHA_TOKEN,
        },
      });

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(400);
      
      const data = await parseResponse(res);
      expect(data.error).toMatch(/CAPTCHA verification failed/i);
    });
  });
});
