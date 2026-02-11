/**
 * Field-Level Encryption for Protected Health Information (PHI)
 * 
 * Uses AES-256-GCM for authenticated encryption.
 * All sensitive health data must be encrypted before storage.
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required for PHI protection. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${ENCRYPTION_KEY.length} characters.`
  );
}

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number; // For future encryption key rotation
}

class FieldEncryption {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY = Buffer.from(ENCRYPTION_KEY!, "hex");
  private static readonly CURRENT_VERSION = 1;

  /**
   * Encrypt sensitive text data
   * Returns null if input is null/undefined
   */
  static encrypt(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);

      let ciphertext = cipher.update(plaintext, "utf8", "hex");
      ciphertext += cipher.final("hex");

      const tag = cipher.getAuthTag();

      const encrypted: EncryptedField = {
        ciphertext,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
        version: this.CURRENT_VERSION,
      };

      return JSON.stringify(encrypted);
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt sensitive data");
    }
  }

  /**
   * Decrypt encrypted field
   * Returns null if input is null/undefined
   */
  static decrypt(encrypted: string | null | undefined): string | null {
    if (!encrypted) return null;

    try {
      const data = JSON.parse(encrypted) as EncryptedField;
      
      // Handle future key rotation by checking version
      if (data.version && data.version !== this.CURRENT_VERSION) {
        // In production, implement key rotation logic here
        console.warn(`Decrypting data with version ${data.version}, current is ${this.CURRENT_VERSION}`);
      }

      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.KEY,
        Buffer.from(data.iv, "hex")
      );
      
      decipher.setAuthTag(Buffer.from(data.tag, "hex"));

      let plaintext = decipher.update(data.ciphertext, "hex", "utf8");
      plaintext += decipher.final("utf8");

      return plaintext;
    } catch (error) {
      console.error("Decryption failed - data may be corrupted or tampered:", error);
      throw new Error("Failed to decrypt sensitive data");
    }
  }

  /**
   * Create a hash for searching/filtering encrypted data
   * Use this to store alongside encrypted data for queries
   */
  static hashForSearch(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    return crypto.createHash("sha256").update(plaintext).digest("hex");
  }

  /**
   * Verify if a string appears to be encrypted data
   */
  static isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    try {
      const data = JSON.parse(value);
      return (
        typeof data.ciphertext === "string" &&
        typeof data.iv === "string" &&
        typeof data.tag === "string"
      );
    } catch {
      return false;
    }
  }

  /**
   * Safely decrypt or return value as-is for backwards compatibility.
   * Use when data may be encrypted (new) or plaintext (legacy).
   */
  static decryptOrPassthrough(value: string | null | undefined): string | null {
    if (!value) return null;
    if (!this.isEncrypted(value)) return value;
    try {
      return this.decrypt(value);
    } catch {
      return value;
    }
  }
}

export { FieldEncryption };
