export interface IEncryptionService {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateSecureToken(length?: number): string;
  hashToken(token: string): string;
}
