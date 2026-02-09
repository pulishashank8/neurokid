/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * TOTP-based MFA for admin accounts
 * 
 * Features:
 * - TOTP generation and verification
 * - Backup codes
 * - MFA enrollment
 * - Force MFA for admin roles
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Simple TOTP implementation
// In production, use a library like 'speakeasy' or 'otpauth'

const MFA_CONFIG = {
  digits: 6,
  step: 30, // 30-second window
  window: 1, // Allow 1 step before/after for clock drift
  backupCodesCount: 10,
} as const;

interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface MFAVerificationResult {
  valid: boolean;
  remainingAttempts?: number;
}

/**
 * Generate a random secret
 */
function generateSecret(): string {
  return crypto.randomBytes(20).toString('base64url');
}

/**
 * Generate TOTP code from secret
 * Simplified implementation - use proper library in production
 */
export function generateTOTP(secret: string, timestamp: number = Date.now()): string {
  const timeStep = Math.floor(timestamp / 1000 / MFA_CONFIG.step);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep), 0);
  
  const secretBuffer = Buffer.from(secret, 'base64url');
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % Math.pow(10, MFA_CONFIG.digits);
  
  return code.toString().padStart(MFA_CONFIG.digits, '0');
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const now = Date.now();
  
  // Check current and adjacent time windows
  for (let i = -MFA_CONFIG.window; i <= MFA_CONFIG.window; i++) {
    const timestamp = now + (i * MFA_CONFIG.step * 1000);
    if (generateTOTP(secret, timestamp) === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < MFA_CONFIG.backupCodesCount; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Setup MFA for user
 */
export async function setupMFA(userId: string): Promise<MFASetup> {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  
  // Hash backup codes for storage
  const hashedBackupCodes = backupCodes.map(code =>
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  // Store in database (but don't enable MFA yet - needs verification)
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaSecret: secret,
      mfaBackupCodes: hashedBackupCodes,
      mfaEnabled: false, // Will be enabled after verification
    },
  });
  
  // Generate QR code URL (simplified)
  const issuer = process.env.MFA_ISSUER_NAME || 'NeuroKind';
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  
  const qrCodeUrl = `otpauth://totp/${issuer}:${user?.email}?secret=${secret}&issuer=${issuer}`;
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify MFA setup (first time)
 */
export async function verifyMFASetup(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true },
  });
  
  if (!user?.mfaSecret) return false;
  
  if (verifyTOTP(user.mfaSecret, code)) {
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
    return true;
  }
  
  return false;
}

/**
 * Verify MFA code during login
 */
export async function verifyMFALogin(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaSecret: true,
      mfaEnabled: true,
      mfaBackupCodes: true,
    },
  });
  
  if (!user?.mfaEnabled) return true; // MFA not required
  
  // Check if it's a TOTP code
  if (user.mfaSecret && verifyTOTP(user.mfaSecret, code)) {
    return true;
  }
  
  // Check if it's a backup code
  if (user.mfaBackupCodes) {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const backupCodes = user.mfaBackupCodes as string[];
    
    if (backupCodes.includes(hashedCode)) {
      // Remove used backup code
      const newBackupCodes = backupCodes.filter(c => c !== hashedCode);
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: newBackupCodes },
      });
      return true;
    }
  }
  
  return false;
}

/**
 * Disable MFA for user
 */
export async function disableMFA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  });
}

/**
 * Check if user requires MFA (admin check)
 */
export async function requiresMFA(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: true },
  });
  
  if (!user) return false;
  
  // Check if user has admin role
  const isAdmin = user.userRoles.some(r =>
    ['ADMIN', 'OWNER', 'MODERATOR'].includes(r.role)
  );
  
  // Admin users must have MFA
  if (isAdmin) {
    return true;
  }
  
  return user.mfaEnabled;
}

/**
 * Check if MFA is enabled for user
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  
  return user?.mfaEnabled || false;
}

export { MFA_CONFIG };
