/**
 * Field-Level Encryption for Protected Health Information (PHI)
 * 
 * Uses AES-256-GCM for authenticated encryption.
 * All sensitive health data must be encrypted before storage.
 * 
 * This module uses lazy initialization - it will not throw on module load,
 * but will validate the encryption key on first use.
 */

import crypto from "crypto";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ context: "encryption" });

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

interface EncryptionConfig {
  key: Buffer;
  version: number;
}

class EncryptionService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly CURRENT_VERSION = 1;
  private static instance: EncryptionService | null = null;
  private config: EncryptionConfig | null = null;
  private initializationError: Error | null = null;
  private initialized = false;

  /**
   * Get singleton instance
   */
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize the encryption service with the encryption key.
   * This is called lazily on first use.
   */
  private initialize(): boolean {
    if (this.initialized) {
      return this.config !== null;
    }

    this.initialized = true;
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      this.initializationError = new Error(
        "ENCRYPTION_KEY environment variable is required for PHI protection. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
      logger.error(this.initializationError.message);
      return false;
    }

    if (encryptionKey.length !== 64) {
      this.initializationError = new Error(
        `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${encryptionKey.length} characters.`
      );
      logger.error(this.initializationError.message);
      return false;
    }

    try {
      this.config = {
        key: Buffer.from(encryptionKey, "hex"),
        version: EncryptionService.CURRENT_VERSION,
      };
      logger.info("Encryption service initialized successfully");
      return true;
    } catch (error) {
      this.initializationError = new Error(
        `Failed to initialize encryption: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      logger.error(this.initializationError.message);
      return false;
    }
  }

  /**
   * Check if encryption is properly configured and available
   */
  isAvailable(): boolean {
    return this.initialize();
  }

  /**
   * Get the current encryption status
   */
  getStatus(): {
    available: boolean;
    version: number;
    error: string | null;
  } {
    const available = this.initialize();
    return {
      available,
      version: available ? EncryptionService.CURRENT_VERSION : 0,
      error: this.initializationError?.message || null,
    };
  }

  /**
   * Ensure encryption is available, throw if not
   */
  private ensureAvailable(): void {
    if (!this.initialize()) {
      throw this.initializationError || new Error("Encryption service not available");
    }
  }

  /**
   * Encrypt sensitive text data
   * Returns null if input is null/undefined
   * Throws if encryption is not available
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    this.ensureAvailable();

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        EncryptionService.ALGORITHM,
        this.config!.key,
        iv
      );

      let ciphertext = cipher.update(plaintext, "utf8", "hex");
      ciphertext += cipher.final("hex");

      const tag = cipher.getAuthTag();

      const encrypted: EncryptedField = {
        ciphertext,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
        version: EncryptionService.CURRENT_VERSION,
      };

      return JSON.stringify(encrypted);
    } catch (error) {
      logger.error({ error }, "Encryption failed");
      throw new Error("Failed to encrypt sensitive data");
    }
  }

  /**
   * Decrypt encrypted field
   * Returns null if input is null/undefined
   * Throws if decryption fails or encryption is not available
   */
  decrypt(encrypted: string | null | undefined): string | null {
    if (!encrypted) return null;
    this.ensureAvailable();

    try {
      const data = JSON.parse(encrypted) as EncryptedField;

      // Handle future key rotation by checking version
      if (data.version && data.version !== EncryptionService.CURRENT_VERSION) {
        logger.warn(
          `Decrypting data with version ${data.version}, current is ${EncryptionService.CURRENT_VERSION}`
        );
        // In production, implement key rotation logic here
      }

      const decipher = crypto.createDecipheriv(
        EncryptionService.ALGORITHM,
        this.config!.key,
        Buffer.from(data.iv, "hex")
      );

      decipher.setAuthTag(Buffer.from(data.tag, "hex"));

      let plaintext = decipher.update(data.ciphertext, "hex", "utf8");
      plaintext += decipher.final("utf8");

      return plaintext;
    } catch (error) {
      logger.error({ error }, "Decryption failed - data may be corrupted or tampered");
      throw new Error("Failed to decrypt sensitive data");
    }
  }

  /**
   * Create a hash for searching/filtering encrypted data
   * Use this to store alongside encrypted data for queries
   */
  hashForSearch(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    return crypto.createHash("sha256").update(plaintext).digest("hex");
  }

  /**
   * Verify if a string appears to be encrypted data
   */
  isEncrypted(value: string | null | undefined): boolean {
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
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();

// Backward compatibility: Export FieldEncryption class with static methods
export class FieldEncryption {
  static encrypt(plaintext: string | null | undefined): string | null {
    return encryptionService.encrypt(plaintext);
  }

  static decrypt(encrypted: string | null | undefined): string | null {
    return encryptionService.decrypt(encrypted);
  }

  static hashForSearch(plaintext: string | null | undefined): string | null {
    return encryptionService.hashForSearch(plaintext);
  }

  static isEncrypted(value: string | null | undefined): boolean {
    return encryptionService.isEncrypted(value);
  }
}

// Export types
export type { EncryptionConfig };
