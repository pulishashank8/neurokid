/**
 * Login CAPTCHA Service
 * 
 * Shows CAPTCHA after 3 failed login attempts to prevent brute force attacks
 * Uses Redis for cross-instance tracking of failed attempts
 */

import { isRedisAvailable } from '@/lib/env';

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_WINDOW_SECONDS = 900; // 15 minutes

interface FailedAttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// In-memory fallback for development
const memoryStore = new Map<string, FailedAttemptRecord>();

async function getRedisClient() {
  if (!isRedisAvailable()) return null;
  try {
    const { Redis } = await import('ioredis');
    const client = new Redis(process.env.REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    await client.connect().catch(() => null);
    return client.status === 'ready' ? client : null;
  } catch {
    return null;
  }
}

function getKey(identifier: string): string {
  return `login:failed:${identifier}`;
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(identifier: string): Promise<void> {
  const key = getKey(identifier);
  const now = Date.now();
  
  const redis = await getRedisClient();
  
  if (redis) {
    // Use Redis with expiration
    const existing = await redis.get(key);
    if (existing) {
      const data: FailedAttemptRecord = JSON.parse(existing);
      data.count += 1;
      data.lastAttempt = now;
      await redis.setex(key, LOCKOUT_WINDOW_SECONDS, JSON.stringify(data));
    } else {
      const data: FailedAttemptRecord = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
      await redis.setex(key, LOCKOUT_WINDOW_SECONDS, JSON.stringify(data));
    }
  } else {
    // Use memory fallback
    const existing = memoryStore.get(key);
    if (existing) {
      // Check if window expired
      if (now - existing.firstAttempt > LOCKOUT_WINDOW_SECONDS * 1000) {
        memoryStore.set(key, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
        });
      } else {
        existing.count += 1;
        existing.lastAttempt = now;
      }
    } else {
      memoryStore.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    }
  }
}

/**
 * Check if CAPTCHA is required for login
 * Returns true if user has 3+ failed attempts
 */
export async function isCaptchaRequired(identifier: string): Promise<boolean> {
  const key = getKey(identifier);
  
  const redis = await getRedisClient();
  
  if (redis) {
    const data = await redis.get(key);
    if (!data) return false;
    
    const record: FailedAttemptRecord = JSON.parse(data);
    return record.count >= MAX_FAILED_ATTEMPTS;
  } else {
    const record = memoryStore.get(key);
    if (!record) return false;
    
    // Check if window expired
    const now = Date.now();
    if (now - record.firstAttempt > LOCKOUT_WINDOW_SECONDS * 1000) {
      memoryStore.delete(key);
      return false;
    }
    
    return record.count >= MAX_FAILED_ATTEMPTS;
  }
}

/**
 * Clear failed login attempts (called on successful login)
 */
export async function clearFailedLogins(identifier: string): Promise<void> {
  const key = getKey(identifier);
  
  const redis = await getRedisClient();
  
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

/**
 * Get remaining attempts before CAPTCHA is required
 */
export async function getRemainingAttempts(identifier: string): Promise<number> {
  const key = getKey(identifier);
  
  const redis = await getRedisClient();
  
  let count = 0;
  
  if (redis) {
    const data = await redis.get(key);
    if (data) {
      const record: FailedAttemptRecord = JSON.parse(data);
      count = record.count;
    }
  } else {
    const record = memoryStore.get(key);
    if (record) {
      // Check if window expired
      const now = Date.now();
      if (now - record.firstAttempt > LOCKOUT_WINDOW_SECONDS * 1000) {
        memoryStore.delete(key);
        count = 0;
      } else {
        count = record.count;
      }
    }
  }
  
  return Math.max(0, MAX_FAILED_ATTEMPTS - count);
}

/**
 * Get time until lockout resets (in seconds)
 */
export async function getLockoutTimeRemaining(identifier: string): Promise<number> {
  const key = getKey(identifier);
  
  const redis = await getRedisClient();
  
  if (redis) {
    const ttl = await redis.ttl(key);
    return Math.max(0, ttl);
  } else {
    const record = memoryStore.get(key);
    if (!record) return 0;
    
    const now = Date.now();
    const elapsed = now - record.firstAttempt;
    const remaining = LOCKOUT_WINDOW_SECONDS * 1000 - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_WINDOW_SECONDS };
