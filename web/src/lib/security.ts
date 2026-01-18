/**
 * Security utilities for data sanitization and validation
 * Prevents sensitive data leakage in API responses
 */

/**
 * Sanitize user object to remove sensitive fields
 * Prevents password hashes and other sensitive data from leaking
 */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'hashedPassword'> {
  const sanitized = { ...(user as T) } as T & { hashedPassword?: string };
  delete sanitized.hashedPassword;
  return sanitized;
}

/**
 * Sanitize multiple user objects
 */
export function sanitizeUsers<T extends Record<string, unknown>>(users: T[]): Omit<T, 'hashedPassword'>[] {
  return users.map(sanitizeUser);
}

/**
 * Remove null and undefined values from response objects
 * Helps reduce response size and prevent potential info leakage
 */
export function removeNullFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  
  return result;
}

/**
 * Sanitize error messages for production
 * Prevents internal error details from leaking to clients
 */
export function sanitizeError(error: unknown, isDevelopment = process.env.NODE_ENV === 'development'): string {
  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // In production, return generic messages
  if (error instanceof Error) {
    // Only expose user-friendly messages
    const safeMessages = [
      'Invalid credentials',
      'Unauthorized',
      'Not found',
      'Validation failed',
      'Rate limit exceeded',
      'Forbidden',
    ];
    
    if (safeMessages.some(msg => error.message.includes(msg))) {
      return error.message;
    }
  }
  
  return 'An error occurred. Please try again later.';
}

/**
 * Validate and sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Truncate to max length
  let sanitized = input.slice(0, maxLength);
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
  
  return sanitized.trim();
}

/**
 * Check if email is from a disposable email provider
 * Helps prevent spam and fake accounts
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'maildrop.cc',
    // Add more as needed
  ];
  
  const domain = email.toLowerCase().split('@')[1];
  return disposableDomains.includes(domain);
}

/**
 * Rate limit response headers
 * Adds standard rate limit headers to responses
 */
export function addRateLimitHeaders(headers: Headers, limit: number, remaining: number, resetTime: Date): void {
  headers.set('X-RateLimit-Limit', String(limit));
  headers.set('X-RateLimit-Remaining', String(remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(resetTime.getTime() / 1000)));
}

/**
 * Sanitize file paths to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  // Remove any path traversal attempts
  return path.replace(/\.\./g, '').replace(/[/\\]/g, '');
}

/**
 * Check password strength
 * Returns true if password meets security requirements
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure session token
 */
export async function generateSecureToken(length = 32): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for logging
 * Useful for debugging without exposing full values
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars);
}

/**
 * Validate and sanitize URL inputs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}
