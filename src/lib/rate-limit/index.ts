/**
 * Production-Grade Rate Limiting
 * 
 * FAILS CLOSED - denies requests when rate limiting is unavailable
 * This prevents DDoS attacks even if Redis is down
 */

import { getEnv, isRedisAvailable } from "@/lib/env";
import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  error?: string;
}

// In-memory store with automatic cleanup
class MemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  get(key: string, windowMs: number): RateLimitEntry | null {
    this.maybeCleanup();
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if window expired
    if (Date.now() - entry.windowStart > windowMs) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const existing = this.get(key, windowMs);

    if (!existing) {
      this.store.set(key, { count: 1, windowStart: now });
      return 1;
    }

    existing.count++;
    return existing.count;
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return;

    // Remove expired entries (older than 1 hour)
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > 3600000) {
        this.store.delete(key);
      }
    }
    this.lastCleanup = now;
  }
}

const memoryStore = new MemoryRateLimitStore();
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  if (!isRedisAvailable()) return null;

  try {
    const { Redis } = await import("ioredis");
    const client = new Redis(getEnv().REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 100, 3000);
      },
    });

    client.on("error", () => {
      redisClient = null;
    });

    await client.connect().catch(() => {
      redisClient = null;
    });

    redisClient = client;
    return client;
  } catch {
    return null;
  }
}

export class RateLimiter {
  readonly name: string;
  readonly maxRequests: number;
  readonly windowSeconds: number;

  constructor(name: string, maxRequests: number, windowSeconds: number) {
    this.name = name;
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  /**
   * Check rate limit - FAILS CLOSED
   * Returns allowed: false on any error
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `ratelimit:${this.name}:${identifier}`;
    const windowMs = this.windowSeconds * 1000;

    try {
      const redis = await getRedisClient();

      if (redis) {
        return await this.checkRedis(redis, key, windowMs);
      } else {
        return this.checkMemory(key, windowMs);
      }
    } catch (error) {
      // FAIL CLOSED: Deny request on any error
      console.error(`Rate limit check failed for ${this.name}:`, error);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + this.windowSeconds * 1000),
        error: "Rate limiting temporarily unavailable. Please try again later.",
      };
    }
  }

  private async checkRedis(
    redis: any,
    key: string,
    windowMs: number
  ): Promise<RateLimitResult> {
    const multi = redis.multi();
    multi.incr(key);
    multi.pexpire(key, windowMs);

    const results = await multi.exec();
    const count = (results?.[0]?.[1] as number) || 1;
    const ttl = await redis.pttl(key);

    return {
      allowed: count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      resetTime: new Date(Date.now() + Math.max(0, ttl)),
    };
  }

  private checkMemory(key: string, windowMs: number): RateLimitResult {
    const count = memoryStore.increment(key, windowMs);
    const entry = memoryStore.get(key, windowMs)!;

    return {
      allowed: count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      resetTime: new Date(entry.windowStart + windowMs),
    };
  }
}

// Pre-configured rate limiters
export const RateLimits = {
  // PHI-related endpoints (stricter)
  therapySessionCreate: new RateLimiter("therapy_session_create", 10, 60),
  therapySessionRead: new RateLimiter("therapy_session_read", 100, 60),
  emergencyCardCreate: new RateLimiter("emergency_card_create", 10, 60),
  emergencyCardRead: new RateLimiter("emergency_card_read", 50, 60),

  // AI endpoints (expensive)
  aiChat: new RateLimiter("ai_chat", 5, 60),
  aiChatDaily: new RateLimiter("ai_chat_daily", 50, 86400),

  // Authentication (strict)
  login: new RateLimiter("login", 5, 300), // 5 per 5 minutes
  register: new RateLimiter("register", 3, 3600), // 3 per hour
  passwordReset: new RateLimiter("password_reset", 3, 3600),

  // Community (moderate)
  postCreate: new RateLimiter("post_create", 10, 60),
  commentCreate: new RateLimiter("comment_create", 20, 60),
  vote: new RateLimiter("vote", 100, 60),

  // File uploads
  fileUpload: new RateLimiter("file_upload", 10, 60),
} as const;

/**
 * Middleware helper to enforce rate limit
 * Returns NextResponse if rate limited, null if allowed
 */
export async function enforceRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<NextResponse | null> {
  const result = await limiter.check(identifier);

  if (!result.allowed) {
    const retryAfter = Math.ceil(
      (result.resetTime.getTime() - Date.now()) / 1000
    );

    return NextResponse.json(
      {
        error: result.error || "Rate limit exceeded",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limiter.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(
            Math.floor(result.resetTime.getTime() / 1000)
          ),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}

export { getRedisClient };
