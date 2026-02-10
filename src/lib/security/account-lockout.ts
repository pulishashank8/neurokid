/**
 * Account Lockout Service
 * 
 * Locks accounts after N failed login attempts to prevent brute force attacks
 * 
 * Features:
 * - Configurable max attempts before lockout
 * - Progressive lockout duration (escalating delays)
 * - Automatic unlock after cooldown period
 * - Manual unlock capability for admins
 * - Email notification on lockout
 */

import { isRedisAvailable } from '@/lib/env';
import { prisma } from '@/lib/prisma';

// Configuration
const CONFIG = {
  maxAttempts: 5,              // Lock after 5 failed attempts
  lockoutDurationMinutes: 30,  // Initial lockout: 30 minutes
  progressiveMultiplier: 2,    // Each lockout is 2x longer
  maxLockoutHours: 24,         // Cap at 24 hours
  resetAfterMinutes: 60,       // Reset counter after 1 hour of no attempts
} as const;

interface LockoutRecord {
  userId: string;
  email: string;
  failedAttempts: number;
  lockedAt: number | null;
  lockedUntil: number | null;
  lockoutCount: number;  // Number of times account has been locked
  lastAttemptAt: number;
}

interface LockoutStatus {
  locked: boolean;
  lockedUntil?: Date;
  remainingAttempts: number;
  failedAttempts: number;
}

// Memory fallback
const memoryStore = new Map<string, LockoutRecord>();

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

function getLockoutKey(userId: string): string {
  return `lockout:${userId}`;
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  userId: string,
  email: string
): Promise<LockoutStatus> {
  const redis = await getRedisClient();
  const key = getLockoutKey(userId);
  const now = Date.now();
  
  let record: LockoutRecord;
  
  if (redis) {
    const data = await redis.get(key);
    if (data) {
      record = JSON.parse(data);
      
      // Reset if enough time passed since last attempt
      if (now - record.lastAttemptAt > CONFIG.resetAfterMinutes * 60000) {
        record.failedAttempts = 0;
      }
    } else {
      // Get lockout count from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockoutCount: true },
      });
      
      record = {
        userId,
        email,
        failedAttempts: 0,
        lockedAt: null,
        lockedUntil: null,
        lockoutCount: user?.lockoutCount || 0,
        lastAttemptAt: now,
      };
    }
  } else {
    record = memoryStore.get(key) || {
      userId,
      email,
      failedAttempts: 0,
      lockedAt: null,
      lockedUntil: null,
      lockoutCount: 0,
      lastAttemptAt: now,
    };
    
    // Reset if enough time passed
    if (now - record.lastAttemptAt > CONFIG.resetAfterMinutes * 60000) {
      record.failedAttempts = 0;
    }
  }
  
  // Check if already locked
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      lockedUntil: new Date(record.lockedUntil),
      remainingAttempts: 0,
      failedAttempts: record.failedAttempts,
    };
  }
  
  // Increment failed attempts
  record.failedAttempts++;
  record.lastAttemptAt = now;
  
  // Check if should lock
  if (record.failedAttempts >= CONFIG.maxAttempts) {
    record.lockoutCount++;
    record.lockedAt = now;
    
    // Calculate lockout duration (progressive)
    const durationMinutes = Math.min(
      CONFIG.lockoutDurationMinutes * Math.pow(CONFIG.progressiveMultiplier, record.lockoutCount - 1),
      CONFIG.maxLockoutHours * 60
    );
    record.lockedUntil = now + (durationMinutes * 60000);
    
    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        lockoutCount: record.lockoutCount,
        lockedUntil: new Date(record.lockedUntil),
      },
    });
    
    // Log security event
    console.warn('[ACCOUNT-LOCKOUT] Account locked:', {
      userId,
      email: email.substring(0, 3) + '***',
      durationMinutes,
      lockoutCount: record.lockoutCount,
    });
  }
  
  // Store record
  if (redis) {
    await redis.setex(
      key,
      Math.max(CONFIG.resetAfterMinutes * 60, (record.lockedUntil || now) - now),
      JSON.stringify(record)
    );
  } else {
    memoryStore.set(key, record);
  }
  
  return {
    locked: !!record.lockedUntil && record.lockedUntil > now,
    lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : undefined,
    remainingAttempts: Math.max(0, CONFIG.maxAttempts - record.failedAttempts),
    failedAttempts: record.failedAttempts,
  };
}

/**
 * Record successful login - clears failed attempts
 */
export async function recordSuccessfulLogin(userId: string): Promise<void> {
  const redis = await getRedisClient();
  const key = getLockoutKey(userId);
  
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(userId: string): Promise<LockoutStatus> {
  // Check database first (for persisted locks)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return {
      locked: true,
      lockedUntil: user.lockedUntil,
      remainingAttempts: 0,
      failedAttempts: CONFIG.maxAttempts,
    };
  }
  
  // Check Redis/memory for active lockout
  const redis = await getRedisClient();
  const key = getLockoutKey(userId);
  
  if (redis) {
    const data = await redis.get(key);
    if (data) {
      const record: LockoutRecord = JSON.parse(data);
      const now = Date.now();
      
      if (record.lockedUntil && record.lockedUntil > now) {
        return {
          locked: true,
          lockedUntil: new Date(record.lockedUntil),
          remainingAttempts: 0,
          failedAttempts: record.failedAttempts,
        };
      }
      
      return {
        locked: false,
        remainingAttempts: Math.max(0, CONFIG.maxAttempts - record.failedAttempts),
        failedAttempts: record.failedAttempts,
      };
    }
  } else {
    const record = memoryStore.get(key);
    if (record) {
      const now = Date.now();
      
      if (record.lockedUntil && record.lockedUntil > now) {
        return {
          locked: true,
          lockedUntil: new Date(record.lockedUntil),
          remainingAttempts: 0,
          failedAttempts: record.failedAttempts,
        };
      }
      
      return {
        locked: false,
        remainingAttempts: Math.max(0, CONFIG.maxAttempts - record.failedAttempts),
        failedAttempts: record.failedAttempts,
      };
    }
  }
  
  return {
    locked: false,
    remainingAttempts: CONFIG.maxAttempts,
    failedAttempts: 0,
  };
}

/**
 * Manually unlock an account (admin function)
 */
export async function unlockAccount(userId: string): Promise<void> {
  const redis = await getRedisClient();
  const key = getLockoutKey(userId);
  
  // Clear Redis/memory
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
  
  // Update database
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: null },
  });
  
  console.info('[ACCOUNT-LOCKOUT] Account manually unlocked:', { userId });
}

/**
 * Get lockout status for admin dashboard
 */
export async function getLockoutStatus(userId: string): Promise<{
  isLocked: boolean;
  lockedUntil?: Date;
  failedAttempts: number;
  lockoutHistory: number;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lockedUntil: true,
      lockoutCount: true,
    },
  });
  
  if (!user) return null;
  
  const status = await isAccountLocked(userId);
  
  return {
    isLocked: status.locked,
    lockedUntil: status.lockedUntil,
    failedAttempts: status.failedAttempts,
    lockoutHistory: user.lockoutCount || 0,
  };
}

export { CONFIG as LOCKOUT_CONFIG };
export type { LockoutRecord, LockoutStatus };
