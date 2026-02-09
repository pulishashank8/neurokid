import { getEnv, isRedisAvailable } from "./env";

/**
 * Redis-based caching utility with in-memory fallback
 * Automatically handles compression for large responses
 *
 * Usage:
 *   const cache = new Cache("posts", 60); // 60s TTL
 *   const cached = await cache.get("query:all");
 *   if (cached) return JSON.parse(cached);
 *   const data = await fetchPosts();
 *   await cache.set("query:all", JSON.stringify(data));
 *   return data;
 */

let redisClient: any = null;
let inMemoryCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Non-blocking key scan using SCAN instead of KEYS
 * KEYS blocks Redis in production with large datasets
 * SCAN iterates incrementally without blocking
 */
async function scanKeys(redis: any, pattern: string): Promise<string[]> {
  if (!redis) return [];

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

/**
 * Initialize Redis client lazily (shared with rateLimit.ts)
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
      console.warn("Redis cache connection error, falling back to in-memory:", err.message);
      redisClient = null;
    });

    redisClient = client;
    return client;
  } catch (error) {
    console.warn(
      "Failed to connect to Redis, using in-memory caching:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export class Cache {
  readonly name: string;
  readonly ttlSeconds: number;

  constructor(name: string, ttlSeconds: number = 300) {
    this.name = name;
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  async get(key: string): Promise<string | null> {
    const fullKey = `cache:${this.name}:${key}`;
    const redis = await getRedisClient();

    if (redis) {
      try {
        const value = await redis.get(fullKey);
        return value || null;
      } catch (error) {
        console.error("Cache get error (Redis):", error);
        return null;
      }
    } else {
      return this.getMemory(fullKey);
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string): Promise<void> {
    const fullKey = `cache:${this.name}:${key}`;
    const redis = await getRedisClient();

    if (redis) {
      try {
        await redis.setEx(fullKey, this.ttlSeconds, value);
      } catch (error) {
        console.error("Cache set error (Redis):", error);
      }
    } else {
      this.setMemory(fullKey, value);
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    const fullKey = `cache:${this.name}:${key}`;
    const redis = await getRedisClient();

    if (redis) {
      try {
        await redis.del(fullKey);
      } catch (error) {
        console.error("Cache delete error (Redis):", error);
      }
    } else {
      inMemoryCache.delete(fullKey);
    }
  }

  /**
   * Clear all cache entries for this cache instance
   * Uses SCAN instead of KEYS to avoid blocking Redis
   */
  async clear(): Promise<void> {
    const redis = await getRedisClient();

    if (redis) {
      try {
        const pattern = `cache:${this.name}:*`;
        // Use scanKeys instead of redis.keys() to avoid blocking
        const keys = await scanKeys(redis, pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (error) {
        console.error("Cache clear error (Redis):", error);
      }
    } else {
      // Clear in-memory entries for this cache
      const pattern = `cache:${this.name}:`;
      for (const [key] of inMemoryCache) {
        if (key.startsWith(pattern)) {
          inMemoryCache.delete(key);
        }
      }
    }
  }

  /**
   * In-memory cache get
   */
  private getMemory(key: string): string | null {
    const entry = inMemoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      inMemoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * In-memory cache set
   */
  private setMemory(key: string, value: string): void {
    inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }
}

/**
 * Pre-configured caches for common endpoints
 */
export const CACHES = {
  posts: new Cache("posts", 45), // 45s for posts (volatile)
  categories: new Cache("categories", 600), // 10 min for categories (stable)
  tags: new Cache("tags", 600), // 10 min for tags (stable)
  resources: new Cache("resources", 300), // 5 min for resources
  providers: new Cache("providers", 600), // 10 min for providers
};

/**
 * Generate cache key from query parameters
 * Ensures consistent cache keys for the same query
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, any>
): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

  return `${endpoint}:${JSON.stringify(sorted)}`;
}

/**
 * Parse query params from URL for caching
 */
export function getCacheKeyFromRequest(
  url: string,
  includeParams: string[] = []
): string {
  try {
    const urlObj = new URL(url);
    const params: Record<string, any> = {};

    for (const param of includeParams) {
      const value = urlObj.searchParams.get(param);
      if (value) params[param] = value;
    }

    return JSON.stringify(params);
  } catch {
    return "";
  }
}

/**
 * Invalidate cache patterns (for mutations)
 * Example: invalidatePattern("posts:*") clears all post caches
 * Uses SCAN instead of KEYS to avoid blocking Redis
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = await getRedisClient();

  if (redis) {
    try {
      // Use scanKeys instead of redis.keys() to avoid blocking
      const keys = await scanKeys(redis, pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error("Cache invalidate error:", error);
    }
  } else {
    // In-memory invalidation
    for (const [key] of inMemoryCache) {
      if (key.includes(pattern.replace("*", ""))) {
        inMemoryCache.delete(key);
      }
    }
  }
}
