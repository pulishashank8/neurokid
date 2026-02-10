import { injectable } from 'tsyringe';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { IEncryptionService } from '@/domain/interfaces/services/IEncryptionService';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

@injectable()
export class EncryptionService implements IEncryptionService {
  private encryptionKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Key should be a 32-byte hex string (64 characters)
    if (key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }

    this.encryptionKey = Buffer.from(key, 'hex');
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid auth tag length');
    }

    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH) as Buffer;

    // Format: salt:hash (both in hex)
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const parts = hash.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const [saltHex, storedHashHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const storedHash = Buffer.from(storedHashHex, 'hex');

    if (salt.length !== SALT_LENGTH || storedHash.length !== KEY_LENGTH) {
      return false;
    }

    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH) as Buffer;

    return timingSafeEqual(derivedKey, storedHash);
  }

  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
