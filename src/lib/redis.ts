import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
let logWarned = false;
const isProd = process.env.NODE_ENV === "production";
const enabled = !!REDIS_URL;

// Initialize Redis client lazily and quietly when not available
const redis = enabled
  ? new Redis(REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    })
  : (null as unknown as Redis);

if (enabled && redis) {
  redis.on("error", (err: any) => {
    if (!logWarned && !isProd) {
      console.warn("Redis unavailable, disabling cache/rate limit:", err?.code || err?.message || err);
      logWarned = true;
    }
  });
}

export { redis };
export function isRedisEnabled(): boolean { return enabled && !!redis; }

// ========================================
// RATE LIMITING CONFIGS
// ========================================

export const RATE_LIMITS = {
  POST_CREATE: { limit: 5, window: 60 }, // 5 posts per minute
  CREATE_POST: { limit: 5, window: 60 }, // alias
  COMMENT_CREATE: { limit: 10, window: 60 }, // 10 comments per minute
  CREATE_COMMENT: { limit: 10, window: 60 }, // alias
  VOTE: { limit: 60, window: 60 }, // 60 votes per minute
  REPORT: { limit: 5, window: 60 }, // 5 reports per minute
};

// ========================================
// RATE LIMITING
// ========================================

export interface RateLimitConfig {
  limit: number; // max requests
  window: number; // time window in seconds
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!isRedisEnabled()) {
    // Disabled: allow all requests, no-op
    return { success: true, remaining: config.limit, reset: Math.ceil(Date.now() / 1000) };
  }
  const now = Date.now();
  const windowMs = config.window * 1000;
  const windowStart = now - windowMs;

  // Use sorted set to track requests by timestamp
  const multi = redis.multi();
  
  // Remove old requests outside window
  multi.zremrangebyscore(key, 0, windowStart);
  
  // Add current request
  multi.zadd(key, now, `${now}`);
  
  // Count requests in window
  multi.zcard(key);
  
  // Set expiry
  multi.expire(key, config.window);

  try {
    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    const remaining = Math.max(0, config.limit - count);
    const success = count <= config.limit;
    const reset = Math.ceil((now + windowMs) / 1000);

    return { success, remaining, reset };
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn("Redis rateLimit disabled:", (error as any)?.code || (error as any)?.message || error);
      logWarned = true;
    }
    return { success: true, remaining: config.limit, reset: Math.ceil((Date.now() + windowMs) / 1000) };
  }
}

// Predefined rate limit configs
// (Already defined above with POST_CREATE, CREATE_POST, COMMENT_CREATE, CREATE_COMMENT aliases, VOTE, and REPORT)

// ========================================
// CACHING
// ========================================

export interface CacheOptions {
  ttl?: number; // seconds, default 60
  prefix?: string;
}

export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  if (!isRedisEnabled()) return null;
  const { prefix = "cache" } = options;
  const fullKey = `${prefix}:${key}`;

  try {
    const cached = await redis.get(fullKey);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn(`Redis getCached disabled for ${fullKey}:`, (error as any)?.code || (error as any)?.message || error);
      logWarned = true;
    }
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  if (!isRedisEnabled()) return;
  const { ttl = 60, prefix = "cache" } = options;
  const fullKey = `${prefix}:${key}`;

  try {
    await redis.setex(fullKey, ttl, JSON.stringify(value));
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn(`Redis setCached disabled for ${fullKey}:`, (error as any)?.code || (error as any)?.message || error);
      logWarned = true;
    }
  }
}

/**
 * Non-blocking key scan using SCAN instead of KEYS
 * KEYS blocks Redis in production with large datasets
 * SCAN iterates incrementally without blocking
 */
async function scanKeys(pattern: string): Promise<string[]> {
  if (!isRedisEnabled()) return [];

  const keys: string[] = [];
  const stream = redis.scanStream({ match: pattern, count: 100 });

  return new Promise((resolve, reject) => {
    stream.on('data', (resultKeys: string[]) => {
      keys.push(...resultKeys);
    });
    stream.on('end', () => resolve(keys));
    stream.on('error', reject);
  });
}

export async function invalidateCache(
  pattern: string,
  options: CacheOptions = {}
): Promise<void> {
  if (!isRedisEnabled()) return;
  const { prefix = "cache" } = options;
  const fullPattern = `${prefix}:${pattern}`;

  try {
    // Use scanKeys instead of redis.keys() to avoid blocking
    const keys = await scanKeys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn(`Redis invalidateCache disabled for ${fullPattern}:`, (error as any)?.code || (error as any)?.message || error);
      logWarned = true;
    }
  }
}

// Predefined cache TTLs
export const CACHE_TTL = {
  POSTS_FEED: 30, // 30 seconds
  POST_DETAIL: 60, // 1 minute
  TAGS: 600, // 10 minutes
  CATEGORIES: 600, // 10 minutes
  COMMENTS: 30, // 30 seconds
};

// Helper to generate cache keys
export function cacheKey(parts: string[]): string {
  return parts.join(":");
}
// ========================================
// DUPLICATE REPORT PREVENTION
// ========================================

/**
 * Check if user has already reported this target within 24h.
 * Returns true if duplicate (should prevent new report).
 */
export async function checkDuplicateReport(
  userId: string,
  targetType: string,
  targetId: string
): Promise<boolean> {
  if (!isRedisEnabled()) return false; // Disabled: allow duplicates

  try {
    const key = `report_block:${userId}:${targetType}:${targetId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn("Redis checkDuplicateReport disabled:", (error as any)?.code || (error as any)?.message);
      logWarned = true;
    }
    return false;
  }
}

/**
 * Mark a report as submitted, block duplicates for 24h.
 */
export async function blockDuplicateReport(
  userId: string,
  targetType: string,
  targetId: string
): Promise<void> {
  if (!isRedisEnabled()) return; // Disabled: no-op

  try {
    const key = `report_block:${userId}:${targetType}:${targetId}`;
    await redis.setex(key, 86400, "1"); // 24h = 86400s
  } catch (error) {
    if (!logWarned && !isProd) {
      console.warn("Redis blockDuplicateReport disabled:", (error as any)?.code || (error as any)?.message);
      logWarned = true;
    }
  }
}