import { vi } from 'vitest';
import {
  generateMFASecret,
  generateTOTPUri,
  generateTOTP,
  verifyTOTP,
  generateBackupCodes,
  verifyBackupCode,
  setupMFA,
  verifyMFAToken,
} from '@/lib/mfa';

// Mock the encryption module
vi.mock('@/lib/encryption', () => ({
  FieldEncryption: {
    encrypt: (val: string) => `encrypted:${val}`,
    decrypt: (val: string) => val.replace('encrypted:', ''),
  },
}));

describe('MFA Service', () => {
  describe('generateMFASecret', () => {
    it('should generate a secret with correct length', () => {
      const secret = generateMFASecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(20); // Base64url encoded 20 bytes
    });

    it('should generate unique secrets', () => {
      const secret1 = generateMFASecret();
      const secret2 = generateMFASecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateTOTPUri', () => {
    it('should generate valid TOTP URI', () => {
      const secret = generateMFASecret();
      const email = 'test@example.com';
      const uri = generateTOTPUri(secret, email);

      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('NeuroKid');
      expect(uri).toContain(encodeURIComponent(email));
      expect(uri).toContain('secret=');
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    it('should use custom issuer if provided', () => {
      const secret = generateMFASecret();
      const email = 'test@example.com';
      const issuer = 'CustomApp';
      const uri = generateTOTPUri(secret, email, issuer);

      expect(uri).toContain(issuer);
    });
  });

  describe('generateTOTP', () => {
    it('should generate 6-digit code', () => {
      const secret = generateMFASecret();
      const code = generateTOTP(secret);

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate same code for same time window', () => {
      const secret = generateMFASecret();
      const timestamp = Date.now();
      const code1 = generateTOTP(secret, timestamp);
      const code2 = generateTOTP(secret, timestamp);

      expect(code1).toBe(code2);
    });

    it('should generate different codes for different time windows', () => {
      const secret = generateMFASecret();
      const code1 = generateTOTP(secret, 0);
      const code2 = generateTOTP(secret, 30000); // 30 seconds later

      expect(code1).not.toBe(code2);
    });
  });

  describe('verifyTOTP', () => {
    it('should verify correct current code', () => {
      const secret = generateMFASecret();
      const code = generateTOTP(secret);

      expect(verifyTOTP(code, secret)).toBe(true);
    });

    it('should reject invalid code format', () => {
      const secret = generateMFASecret();

      expect(verifyTOTP('12345', secret)).toBe(false); // Too short
      expect(verifyTOTP('1234567', secret)).toBe(false); // Too long
      expect(verifyTOTP('abcdef', secret)).toBe(false); // Not digits
      expect(verifyTOTP('', secret)).toBe(false); // Empty
    });

    it('should reject completely wrong code', () => {
      const secret = generateMFASecret();

      // Generate code for wrong time
      expect(verifyTOTP('000000', secret)).toBe(false);
    });

    it('should allow codes within time window', () => {
      const secret = generateMFASecret();
      const now = Date.now();

      // Code from 30 seconds ago (within window of 1)
      const pastCode = generateTOTP(secret, now - 30000);
      expect(verifyTOTP(pastCode, secret, 1)).toBe(true);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const { codes, hashes } = generateBackupCodes();

      expect(codes).toHaveLength(10);
      expect(hashes).toHaveLength(10);
    });

    it('should generate alphanumeric codes', () => {
      const { codes } = generateBackupCodes();

      codes.forEach((code) => {
        // Codes are base64url encoded and uppercased, may contain dashes
        expect(code.length).toBeGreaterThanOrEqual(6);
        expect(code).toMatch(/^[A-Z0-9_-]+$/);
      });
    });

    it('should generate unique codes', () => {
      const { codes } = generateBackupCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    // Note: Backup code hash verification tested in verifyBackupCode tests below
  });

  describe('verifyBackupCode', () => {
    it('should reject invalid backup code', () => {
      const { hashes } = generateBackupCodes();

      expect(verifyBackupCode('INVALID1', hashes)).toBe(false);
    });

    it('should reject empty backup code', () => {
      const { hashes } = generateBackupCodes();

      expect(verifyBackupCode('', hashes)).toBe(false);
    });
  });

  describe('setupMFA', () => {
    it('should return complete setup result', () => {
      const email = 'test@example.com';
      const result = setupMFA(email);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUri');
      expect(result).toHaveProperty('backupCodes');
      expect(result).toHaveProperty('encryptedSecret');
      expect(result).toHaveProperty('encryptedBackupCodes');

      expect(result.backupCodes).toHaveLength(10);
      expect(result.encryptedBackupCodes).toHaveLength(10);
      expect(result.qrCodeUri).toContain('otpauth://totp/');
    });
  });

  describe('verifyMFAToken', () => {
    it('should verify TOTP token', () => {
      const email = 'test@example.com';
      const setup = setupMFA(email);
      const code = generateTOTP(setup.secret);

      const result = verifyMFAToken(code, setup.encryptedSecret, setup.encryptedBackupCodes);

      expect(result.valid).toBe(true);
      expect(result.isBackupCode).toBe(false);
    });

    it('should verify backup code', () => {
      const email = 'test@example.com';
      const setup = setupMFA(email);
      const backupCode = setup.backupCodes[0];

      const result = verifyMFAToken(backupCode, setup.encryptedSecret, setup.encryptedBackupCodes);

      expect(result.valid).toBe(true);
      expect(result.isBackupCode).toBe(true);
    });

    it('should reject invalid token', () => {
      const email = 'test@example.com';
      const setup = setupMFA(email);

      const result = verifyMFAToken('invalid', setup.encryptedSecret, setup.encryptedBackupCodes);

      expect(result.valid).toBe(false);
      expect(result.isBackupCode).toBe(false);
    });
  });
});
