import { getEnv, isRedisAvailable } from "./env";
import { NextResponse } from "next/server";

/**
 * Redis-based rate limiter with in-memory fallback for development
 * Uses token bucket algorithm: allows N requests per window
 *
 * Usage:
 *   const limiter = new RateLimiter("register", 3, 3600); // 3 per hour
 *   const canProceed = await limiter.checkLimit(ipAddress);
 *   if (!canProceed) {
 *     const retryAfter = await limiter.getRetryAfter(ipAddress);
 *     return res.status(429).json({ error: "Rate limit exceeded", retryAfterSeconds: retryAfter });
 *   }
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

let redisClient: any = null;
let inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Initialize Redis client lazily
 */
async function getRedisClient() {
  if (redisClient) return redisClient;

  if (!isRedisAvailable()) {
    return null;
  }

  try {
    // Lazy load Redis (using ioredis)
    const { Redis } = await import("ioredis");
    const client = new Redis(getEnv().REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    });

    client.on("error", (err: any) => {
      console.warn("Redis connection error, falling back to in-memory:", err.message);
      redisClient = null;
    });

    redisClient = client;
    console.log("✓ Redis connected for rate limiting");
    return client;
  } catch (error) {
    console.warn(
      "Failed to connect to Redis, using in-memory rate limiting:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export class RateLimiter {
  readonly name: string;
  readonly maxTokens: number;
  readonly windowSeconds: number;

  constructor(
    name: string,
    maxTokens: number,
    windowSeconds: number = 60
  ) {
    this.name = name;
    this.maxTokens = maxTokens;
    this.windowSeconds = windowSeconds;
  }

  /**
   * Check if request is allowed
   * Returns true if within limit, false if exceeded
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const key = `ratelimit:${this.name}:${identifier}`;
    const redis = await getRedisClient();

    if (redis) {
      return this.checkLimitRedis(redis, key);
    } else {
      return this.checkLimitMemory(key);
    }
  }

  /**
   * Get seconds until next request allowed
   */
  async getRetryAfter(identifier: string): Promise<number> {
    const key = `ratelimit:${this.name}:${identifier}`;
    const redis = await getRedisClient();

    if (redis) {
      const ttl = await redis.ttl(key);
      return Math.max(1, ttl);
    } else {
      const entry = inMemoryStore.get(key);
      if (!entry) return 0;

      const elapsed = (Date.now() - entry.lastRefill) / 1000;
      const remaining = this.windowSeconds - elapsed;
      return Math.max(1, Math.ceil(remaining));
    }
  }

  /**
   * Redis-based rate limiting
   */
  private async checkLimitRedis(redis: any, key: string): Promise<boolean> {
    try {
      const current = await redis.incr(key);

      if (current === 1) {
        // First request in window, set expiry
        await redis.expire(key, this.windowSeconds);
      }

      return current <= this.maxTokens;
    } catch (error) {
      console.error("Redis rate limit check failed:", error);
      // Fail open - allow request if Redis fails
      return true;
    }
  }

  /**
   * In-memory rate limiting (development fallback)
   */
  private checkLimitMemory(key: string): boolean {
    const now = Date.now();
    let entry = inMemoryStore.get(key);

    if (!entry) {
      inMemoryStore.set(key, {
        tokens: 1,
        lastRefill: now,
      });
      return true;
    }

    // Check if window expired
    const elapsed = (now - entry.lastRefill) / 1000;
    if (elapsed >= this.windowSeconds) {
      // Reset window
      entry = { tokens: 1, lastRefill: now };
      inMemoryStore.set(key, entry);
      return true;
    }

    // Still within window
    if (entry.tokens < this.maxTokens) {
      entry.tokens++;
      inMemoryStore.set(key, entry);
      return true;
    }

    return false;
  }

  /**
   * Reset limit for identifier (for testing)
   */
  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${this.name}:${identifier}`;
    const redis = await getRedisClient();

    if (redis) {
      await redis.del(key);
    } else {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Pre-configured rate limiters for common endpoints
 * OWASP Best Practices: Implement rate limiting on ALL public endpoints
 */
export const RATE_LIMITERS = {
  // Authentication endpoints - strict limits
  register: new RateLimiter("register", 5, 3600), // 5/hour per IP
  login: new RateLimiter("login", 10, 60), // 10/min per IP

  // Content creation - reasonable limits to prevent spam
  createPost: new RateLimiter("createPost", 5, 60), // 5/min per user
  createComment: new RateLimiter("createComment", 10, 60), // 10/min per user

  // Voting - higher limit for genuine engagement
  vote: new RateLimiter("vote", 60, 60), // 60/min per user

  // Reporting - prevent abuse
  report: new RateLimiter("report", 5, 60), // 5/min per user

  // AI features - protect API costs
  aiChat: new RateLimiter("aiChat", 5, 60), // 5/min per user

  // Read operations - generous limits, prevent scraping/DoS
  readPosts: new RateLimiter("readPosts", 100, 60), // 100/min per IP
  readPost: new RateLimiter("readPost", 200, 60), // 200/min per IP
  readComments: new RateLimiter("readComments", 100, 60), // 100/min per IP
  readResources: new RateLimiter("readResources", 100, 60), // 100/min per IP

  // User profile operations
  updateProfile: new RateLimiter("updateProfile", 10, 60), // 10/min per user
  changePassword: new RateLimiter("changePassword", 3, 3600), // 3/hour per user
  deleteAccount: new RateLimiter("deleteAccount", 1, 3600), // 1/hour per user

  // Bookmark operations
  toggleBookmark: new RateLimiter("toggleBookmark", 30, 60), // 30/min per user

  // Moderation actions - prevent abuse
  moderateContent: new RateLimiter("moderateContent", 30, 60), // 30/min per moderator

  // Update operations
  updatePost: new RateLimiter("updatePost", 10, 60), // 10/min per user
  updateComment: new RateLimiter("updateComment", 10, 60), // 10/min per user

  // Delete operations
  deletePost: new RateLimiter("deletePost", 10, 60), // 10/min per user
  deleteComment: new RateLimiter("deleteComment", 10, 60), // 10/min per user
};

/**
 * Extract IP from request (works behind proxies)
 * OWASP: Properly extract client IP considering proxy headers
 */
export function getClientIp(request: Request): string {
  // Check multiple headers in order of preference
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  // x-forwarded-for can contain multiple IPs, take the first (original client)
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Check rate limit and return response if exceeded
 */
export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const allowed = await limiter.checkLimit(identifier);

  if (!allowed) {
    const retryAfterSeconds = await limiter.getRetryAfter(identifier);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

/**
 * Create rate limit error response
 * OWASP: Return proper 429 status with Retry-After header
 */
export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down.",
      retryAfterSeconds,
      message: `Please wait ${retryAfterSeconds} seconds before trying again.`
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + retryAfterSeconds),
      },
    }
  );
}

/**
 * Clear rate limit for a specific identifier (useful for development/testing)
 */
export async function clearRateLimit(limiterName: string, identifier: string): Promise<void> {
  const key = `ratelimit:${limiterName}:${identifier}`;
  const redis = await getRedisClient();

  if (redis) {
    await redis.del(key);
  } else {
    inMemoryStore.delete(key);
  }
}
