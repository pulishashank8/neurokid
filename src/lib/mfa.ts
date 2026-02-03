/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * Implements TOTP (Time-based One-Time Password) for MFA
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator
 * 
 * Database schema additions needed:
 *   - User.mfaEnabled: Boolean
 *   - User.mfaSecret: String (encrypted)
 *   - User.mfaBackupCodes: String[] (hashed)
 * 
 * Environment variables:
 *   MFA_ISSUER_NAME=NeuroKid
 *   ENCRYPTION_KEY=existing_encryption_key
 */

import crypto from "crypto";
import { FieldEncryption } from "./encryption";

// TOTP Configuration
const TOTP_PERIOD = 30; // 30 seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "sha1";
const BACKUP_CODE_COUNT = 10;

/**
 * Generate a new MFA secret
 */
export { generateTOTPUri };

export function generateMFASecret(): string {
  // Generate 20 random bytes (160 bits) for RFC 4226/6238
  return crypto.randomBytes(20).toString("base64url");
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = process.env.MFA_ISSUER_NAME || "NeuroKid"
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  
  // RFC 6238 TOTP URI format
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${base32Encode(
    Buffer.from(secret, "base64url")
  )}&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate TOTP code for given secret and time
 */
export function generateTOTP(
  secret: string,
  timestamp: number = Date.now()
): string {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
  const secretBuffer = Buffer.from(secret, "base64url");
  
  // Create buffer from counter (8 bytes, big-endian)
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
  
  // HMAC-SHA1
  const hmac = crypto.createHmac(TOTP_ALGORITHM, secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  // Dynamic truncation (RFC 4226)
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  // Modulo to get N digits
  const otp = code % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Verify TOTP code with time window tolerance
 */
export function verifyTOTP(
  token: string,
  secret: string,
  window: number = 1 // Allow +/- 1 period (30 seconds before/after)
): boolean {
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  
  const now = Date.now();
  
  // Check current and adjacent time windows
  for (let i = -window; i <= window; i++) {
    const expectedCode = generateTOTP(secret, now + i * TOTP_PERIOD * 1000);
    if (timingSafeCompare(token, expectedCode)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(): {
  codes: string[];
  hashes: string[];
} {
  const codes: string[] = [];
  const hashes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto
      .randomBytes(6)
      .toString("base64url")
      .toUpperCase()
      .slice(0, 8);
    
    codes.push(code);
    // Store SHA-256 hash of code
    hashes.push(crypto.createHash("sha256").update(code).digest("hex"));
  }
  
  return { codes, hashes };
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): boolean {
  const normalizedCode = code.toUpperCase().replace(/-/g, "");
  const hash = crypto.createHash("sha256").update(normalizedCode).digest("hex");
  
  return hashedCodes.some((hashedCode) => timingSafeCompare(hash, hashedCode));
}

/**
 * Encrypt MFA secret for storage
 */
export function encryptMFASecret(secret: string): string {
  return FieldEncryption.encrypt(secret) || "";
}

/**
 * Decrypt MFA secret from storage
 */
export function decryptMFASecret(encrypted: string): string | null {
  return FieldEncryption.decrypt(encrypted);
}

/**
 * Base32 encoding for authenticator compatibility
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  return output;
}

/**
 * Timing-safe string comparison
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * MFA setup response interface
 */
export interface MFASetupResult {
  secret: string; // Raw secret (show once)
  qrCodeUri: string; // For QR code generation
  backupCodes: string[]; // Plain backup codes (show once)
  encryptedSecret: string; // For database storage
  encryptedBackupCodes: string[]; // Hashed backup codes for database
}

/**
 * Initialize MFA for a user
 */
export function setupMFA(email: string): MFASetupResult {
  const secret = generateMFASecret();
  const qrCodeUri = generateTOTPUri(secret, email);
  const { codes: backupCodes, hashes } = generateBackupCodes();
  
  return {
    secret,
    qrCodeUri,
    backupCodes,
    encryptedSecret: encryptMFASecret(secret),
    encryptedBackupCodes: hashes,
  };
}

/**
 * Verify MFA token (TOTP or backup code)
 */
export function verifyMFAToken(
  token: string,
  encryptedSecret: string,
  backupCodeHashes: string[]
): { valid: boolean; isBackupCode: boolean } {
  // Try TOTP first
  const secret = decryptMFASecret(encryptedSecret);
  if (secret && verifyTOTP(token, secret)) {
    return { valid: true, isBackupCode: false };
  }
  
  // Try backup code
  if (verifyBackupCode(token, backupCodeHashes)) {
    return { valid: true, isBackupCode: true };
  }
  
  return { valid: false, isBackupCode: false };
}
