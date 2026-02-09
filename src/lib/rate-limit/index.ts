/**
 * Production-Grade Rate Limiting
 * 
 * FAILS CLOSED - denies requests when rate limiting is unavailable
 * This prevents DDoS attacks even if Redis is down
 * 
 * Features:
 * - Admin bypass for internal services
 * - Redis-only mode for production (no memory fallback)
 * - Multi-layer protection for sensitive endpoints
 */

import { getEnv, isRedisAvailable } from "@/lib/env";
import { NextResponse } from "next/server";

// Configuration
const RATE_LIMIT_CONFIG = {
  // Set RATE_LIMIT_REDIS_ONLY=true to disable memory fallback (production)
  redisOnly: process.env.RATE_LIMIT_REDIS_ONLY === 'true',
  // Admin bypass - set admin session identifiers that bypass rate limits
  adminBypassKeys: process.env.RATE_LIMIT_ADMIN_KEYS?.split(',') || [],
};

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
  readonly skipAdminBypass: boolean;

  constructor(
    name: string, 
    maxRequests: number, 
    windowSeconds: number,
    skipAdminBypass: boolean = false
  ) {
    this.name = name;
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
    this.skipAdminBypass = skipAdminBypass;
  }

  /**
   * Check if identifier has admin bypass
   */
  private hasAdminBypass(identifier: string): boolean {
    if (this.skipAdminBypass) return false;
    return RATE_LIMIT_CONFIG.adminBypassKeys.includes(identifier);
  }

  /**
   * Check rate limit - FAILS CLOSED
   * Returns allowed: false on any error
   */
  async check(identifier: string): Promise<RateLimitResult> {
    // Admin bypass check
    if (this.hasAdminBypass(identifier)) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: new Date(Date.now() + this.windowSeconds * 1000),
      };
    }

    const key = `ratelimit:${this.name}:${identifier}`;
    const windowMs = this.windowSeconds * 1000;

    try {
      const redis = await getRedisClient();

      if (redis) {
        return await this.checkRedis(redis, key, windowMs);
      } else if (!RATE_LIMIT_CONFIG.redisOnly) {
        // Only use memory fallback if Redis is not available AND redisOnly mode is disabled
        return this.checkMemory(key, windowMs);
      } else {
        // Redis-only mode: fail closed if Redis is unavailable
        console.error(`Rate limiting unavailable in Redis-only mode for ${this.name}`);
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + this.windowSeconds * 1000),
          error: "Rate limiting temporarily unavailable. Please try again later.",
        };
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

  /**
   * Legacy method for backward compatibility
   * @deprecated Use check() instead
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const result = await this.check(identifier);
    return result.allowed;
  }

  /**
   * Get retry after time in seconds
   */
  async getRetryAfter(identifier: string): Promise<number> {
    const result = await this.check(identifier);
    if (result.allowed) return 0;
    return Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
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
  login: new RateLimiter("login", 10, 60), // 10/min per IP
  register: new RateLimiter("register", 5, 3600), // 5/hour per IP
  passwordReset: new RateLimiter("password_reset", 3, 3600),
  forgotPassword: new RateLimiter("forgot_password", 3, 300), // 3 per 5 min per email
  forgotPasswordDaily: new RateLimiter("forgot_password_daily", 5, 86400),
  forgotPasswordIp: new RateLimiter("forgot_password_ip", 10, 300), // 10 per 5 min per IP (additional protection)
  resetPassword: new RateLimiter("reset_password", 5, 300), // 5 per 5 min per IP
  resetPasswordToken: new RateLimiter("reset_password_token", 3, 3600), // 3 per hour per token (prevent brute force)
  resetPasswordGlobal: new RateLimiter("reset_password_global", 20, 60), // 20 per minute global (DDoS protection)
  verifyEmail: new RateLimiter("verify_email", 10, 60),
  resendVerification: new RateLimiter("resend_verification", 3, 300),
  verification: new RateLimiter("verification", 1, 60),
  verificationDaily: new RateLimiter("verification_daily", 10, 86400),

  // Community (moderate)
  postCreate: new RateLimiter("post_create", 5, 60), // 5/min per user
  createPost: new RateLimiter("create_post", 5, 60), // alias
  commentCreate: new RateLimiter("comment_create", 10, 60),
  createComment: new RateLimiter("create_comment", 10, 60), // alias
  vote: new RateLimiter("vote", 60, 60),
  report: new RateLimiter("report", 5, 60),
  readComments: new RateLimiter("read_comments", 100, 60),
  readPost: new RateLimiter("read_post", 200, 60),
  updateProfile: new RateLimiter("update_profile", 10, 60),
  connectionRequest: new RateLimiter("connection_request", 10, 60),
  userSearch: new RateLimiter("user_search", 30, 60),
  userProfile: new RateLimiter("user_profile", 60, 60),

  // Search endpoints (expensive operations)
  searchPosts: new RateLimiter("search_posts", 30, 60), // 30/min per user
  searchPostsGlobal: new RateLimiter("search_posts_global", 100, 60), // 100/min global
  searchUsers: new RateLimiter("search_users", 30, 60),
  searchProviders: new RateLimiter("search_providers", 20, 60),
  searchGlobal: new RateLimiter("search_global", 50, 60), // General search limit

  // File uploads
  fileUpload: new RateLimiter("file_upload", 10, 60),
  upload: new RateLimiter("upload", 10, 60), // alias
} as const;

// Legacy alias for backward compatibility during migration
export const RATE_LIMITERS = RateLimits;

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

/**
 * Extract IP from request (works behind proxies)
 * @deprecated Use getClientIp from @/lib/utils instead
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip");
  return ip || "unknown";
}

/**
 * Check rate limit and return response
 * @deprecated Use enforceRateLimit instead
 */
export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const result = await limiter.check(identifier);
  
  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil(
      (result.resetTime.getTime() - Date.now()) / 1000
    );
    return { allowed: false, retryAfterSeconds };
  }
  
  return { allowed: true };
}

/**
 * Create rate limit error response
 * @deprecated Use enforceRateLimit instead which returns the response directly
 */
export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
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
    // Note: Memory store is private, this won't work for memory fallback
    console.warn("Cannot clear rate limit for memory store");
  }
}

/**
 * Admin bypass helpers for internal services
 */

/**
 * Generate admin bypass key for a user
 * This should be called from authenticated admin endpoints
 */
export function generateAdminBypassKey(userId: string, role: string): string {
  return `admin:${role}:${userId}`;
}

/**
 * Check if a user has admin bypass privileges
 * Use this in middleware or API routes to skip rate limiting for admins
 */
export function isAdminBypassAllowed(userId: string, roles: string[]): boolean {
  // Check if user has any admin roles
  const hasAdminRole = roles.some(r => ['ADMIN', 'MODERATOR', 'OWNER'].includes(r));
  if (!hasAdminRole) return false;

  // Check if the admin bypass key is configured
  const adminKey = generateAdminBypassKey(userId, roles.find(r => ['ADMIN', 'MODERATOR', 'OWNER'].includes(r)) || 'admin');
  return RATE_LIMIT_CONFIG.adminBypassKeys.includes(adminKey);
}

/**
 * Get rate limiting configuration status
 */
export function getRateLimitConfig(): {
  redisOnly: boolean;
  hasAdminBypass: boolean;
  adminBypassCount: number;
} {
  return {
    redisOnly: RATE_LIMIT_CONFIG.redisOnly,
    hasAdminBypass: RATE_LIMIT_CONFIG.adminBypassKeys.length > 0,
    adminBypassCount: RATE_LIMIT_CONFIG.adminBypassKeys.length,
  };
}

export { getRedisClient };
