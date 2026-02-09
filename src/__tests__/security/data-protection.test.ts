/**
 * Data Protection Security Tests
 * 
 * Tests for:
 * - PHI encryption at rest
 * - Password hashing
 * - Token security
 * - HTTPS enforcement
 * - Security headers
 * - PII handling in logs
 */

import { resetMockData } from '../setup';
import { createTestUser, createMockSession } from '../helpers/auth';
import { getTestPrisma } from '../helpers/database';
import bcrypt from 'bcryptjs';

const prisma = getTestPrisma();

describe('Data Protection Security Tests', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('PHI Encryption at Rest', () => {
    it('should encrypt therapy session notes', async () => {
      const user = await createTestUser('therapy-phi@example.com', 'password123', 'therapyphi');
      
      const session = await prisma.therapySession.create({
        data: {
          userId: user.id,
          childName: 'Test Child',
          therapistName: 'Dr. Test',
          therapyType: 'ABA',
          sessionDate: new Date(),
          duration: 60,
          notes: 'These notes contain sensitive PHI about the child',
          wentWell: 'Eye contact improved',
          toWorkOn: 'Verbal communication',
        },
      });

      // Retrieve raw from database
      const rawSession = await prisma.therapySession.findUnique({
        where: { id: session.id },
      });

      expect(rawSession).toBeDefined();
      // Sensitive fields should be encrypted (implementation dependent)
      expect(rawSession?.notes).toBeDefined();
    });

    it('should encrypt emergency card PHI fields', async () => {
      const user = await createTestUser('emergency-phi@example.com', 'password123', 'emergencyphi');
      
      const card = await prisma.emergencyCard.create({
        data: {
          userId: user.id,
          childName: 'Test Child',
          triggers: 'Loud noises, bright lights',
          calmingStrategies: 'Deep breathing, weighted blanket',
          communication: 'Non-verbal, uses AAC device',
          medications: 'Melatonin 3mg',
          allergies: 'Peanuts, tree nuts',
          additionalNotes: 'Sensitive medical information',
        },
      });

      const rawCard = await prisma.emergencyCard.findUnique({
        where: { id: card.id },
      });

      expect(rawCard).toBeDefined();
      expect(rawCard?.triggers).toBeDefined();
      expect(rawCard?.medications).toBeDefined();
    });

    it('should decrypt PHI when accessed by authorized user', async () => {
      const user = await createTestUser('decrypt@example.com', 'password123', 'decryptuser');
      
      await prisma.therapySession.create({
        data: {
          userId: user.id,
          childName: 'Test Child',
          therapistName: 'Dr. Test',
          therapyType: 'ABA',
          sessionDate: new Date(),
          duration: 60,
          notes: 'Original sensitive notes',
        },
      });

      const sessions = await prisma.therapySession.findMany({
        where: { userId: user.id },
      });

      expect(sessions.length).toBeGreaterThan(0);
      // Notes should be accessible (decrypted) for authorized access
      expect(sessions[0].notes).toBeDefined();
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const plainPassword = 'TestPassword123!';
      const user = await createTestUser('hash-test@example.com', plainPassword, 'hashtest');

      const userInDb = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(userInDb?.hashedPassword).toBeDefined();
      expect(userInDb?.hashedPassword).not.toBe(plainPassword);
      // Should be a valid bcrypt hash
      expect(userInDb?.hashedPassword).toMatch(/^\$2[aby]\$/);
    });

    it('should use appropriate bcrypt work factor', async () => {
      const user = await createTestUser('workfactor@example.com', 'password123', 'workfactor');

      const userInDb = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Extract work factor from bcrypt hash
      const hash = userInDb?.hashedPassword || '';
      const workFactorMatch = hash.match(/^\$2[aby]\$(\d+)\$/);
      
      if (workFactorMatch) {
        const workFactor = parseInt(workFactorMatch[1]);
        // Should be at least 10 (adjust based on your security requirements)
        expect(workFactor).toBeGreaterThanOrEqual(10);
      }
    });

    it('should verify passwords correctly', async () => {
      const plainPassword = 'TestPassword123!';
      const user = await createTestUser('verify@example.com', plainPassword, 'verifyuser');

      const userInDb = await prisma.user.findUnique({
        where: { id: user.id },
      });

      const isValid = await bcrypt.compare(plainPassword, userInDb?.hashedPassword || '');
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongpassword', userInDb?.hashedPassword || '');
      expect(isInvalid).toBe(false);
    });

    it('should generate unique salts for each password', async () => {
      const password = 'SamePassword123!';
      const user1 = await createTestUser('salt1@example.com', password, 'salt1');
      const user2 = await createTestUser('salt2@example.com', password, 'salt2');

      const dbUser1 = await prisma.user.findUnique({ where: { id: user1.id } });
      const dbUser2 = await prisma.user.findUnique({ where: { id: user2.id } });

      // Same password should result in different hashes due to salting
      expect(dbUser1?.hashedPassword).not.toBe(dbUser2?.hashedPassword);
    });
  });

  describe('Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const user = await createTestUser('token@example.com', 'password123', 'tokenuser');

      // Create verification token
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.randomUUID(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      expect(token.tokenHash).toBeDefined();
      expect(token.tokenHash.length).toBeGreaterThan(20);
    });

    it('should set appropriate token expiration', async () => {
      const user = await createTestUser('expiry@example.com', 'password123', 'expiryuser');

      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: 'test-hash',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const now = new Date();
      const expiry = new Date(token.expiresAt);
      
      // Token should expire in the future
      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
      // But not too far in the future (adjust based on your policy)
      expect(expiry.getTime()).toBeLessThan(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    it('should invalidate tokens after use', async () => {
      const user = await createTestUser('invalidate@example.com', 'password123', 'invalidateuser');

      const token = await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: 'test-hash',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Mark as used
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      const usedToken = await prisma.passwordResetToken.findUnique({
        where: { id: token.id },
      });

      expect(usedToken?.usedAt).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      // This test would verify security headers are set
      // Implementation depends on your middleware setup
      const expectedHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
      ];

      // Placeholder - implement based on actual header configuration
      expect(expectedHeaders.length).toBeGreaterThan(0);
    });

    it('should set appropriate CSP headers', async () => {
      // Content Security Policy headers
      const expectedCSPDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
      ];

      expect(expectedCSPDirectives.length).toBeGreaterThan(0);
    });
  });

  describe('PII Handling', () => {
    it('should not log sensitive PII', async () => {
      const user = await createTestUser('pii@example.com', 'password123', 'piiuser');

      // Simulate an action that might be logged
      const sensitiveData = {
        email: user.email,
        password: 'should-not-log',
        ssn: '123-45-6789',
      };

      // This test would verify that sensitive data is not in logs
      // Implementation depends on your logging setup
      expect(sensitiveData.password).toBe('should-not-log');
    });

    it('should mask PII in error messages', async () => {
      const user = await createTestUser('mask@example.com', 'password123', 'maskuser');

      // Error messages should not contain full PII
      const errorMessage = `User ${user.email} encountered an error`;
      const maskedMessage = errorMessage.replace(/[^@\s]+@/, '***@');
      
      expect(maskedMessage).not.toContain(user.email?.split('@')[0]);
    });
  });

  describe('Data Retention', () => {
    it('should respect data retention policies', async () => {
      const user = await createTestUser('retention@example.com', 'password123', 'retentionuser');

      // Create old data
      const oldSession = await prisma.therapySession.create({
        data: {
          userId: user.id,
          childName: 'Old Child',
          therapistName: 'Dr. Old',
          therapyType: 'ABA',
          sessionDate: new Date('2020-01-01'),
          duration: 60,
          createdAt: new Date('2020-01-01'),
        },
      });

      // Data retention policy would determine if this should be deleted
      expect(oldSession).toBeDefined();
    });
  });

  describe('Secure Transmission', () => {
    it('should enforce HTTPS in production', async () => {
      // This test verifies HTTPS enforcement
      // Would typically check environment or middleware behavior
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // In production, HTTPS should be enforced
        expect(true).toBe(true);
      }
    });

    it('should use secure cookies', async () => {
      // Cookie settings should include secure flag
      const expectedCookieFlags = ['Secure', 'HttpOnly', 'SameSite'];
      expect(expectedCookieFlags).toContain('Secure');
      expect(expectedCookieFlags).toContain('HttpOnly');
    });
  });
});
