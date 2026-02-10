/**
 * Cache-Aside Pattern Implementation
 * 
 * Provides consistent caching across all services with the cache-aside pattern:
 * 1. Check cache first
 * 2. If cache miss, fetch from data source
 * 3. Store result in cache
 * 4. Return result
 * 
 * This ensures:
 * - Consistent caching behavior across all services
 * - Proper cache invalidation on mutations
 * - Type-safe cache operations
 * - Automatic serialization/deserialization
 * - Integration with stampede protection
 * 
 * Usage:
 *   import { CacheAsideService } from "@/lib/cache-aside";
 *   
 *   // Basic usage
 *   const user = await CacheAsideService.get(
 *     "user",
 *     userId,
 *     () => prisma.user.findUnique({ where: { id: userId } })
 *   );
 *   
 *   // With custom TTL
 *   const posts = await CacheAsideService.get(
 *     "posts",
 *     `feed:${userId}`,
 *     () => fetchUserFeed(userId),
 *     { ttl: 30 }
 *   );
 *   
 *   // Invalidate on mutation
 *   await CacheAsideService.invalidate("user", userId);
 *   await CacheAsideService.invalidatePattern("posts", `feed:${userId}:*`);
 */

import { Cache } from "@/lib/cache";
import { StampedeProtectedCache } from "@/lib/cache-stampede";
import { invalidateCachePattern } from "@/lib/cache";
import { CacheAnalytics } from "@/lib/cache-analytics";

// Cache configuration by entity type
interface CacheConfig {
  ttl: number;
  useStampedeProtection: boolean;
  earlyExpirationWindow?: number;
  refreshProbability?: number;
}

// Default configurations for different entity types
const DEFAULT_CONFIGS: Record<string, CacheConfig> = {
  // User data - moderate TTL, stampede protected
  user: { ttl: 300, useStampedeProtection: true, refreshProbability: 0.08 },
  
  // Posts - short TTL, high traffic
  posts: { ttl: 45, useStampedeProtection: true, refreshProbability: 0.05 },
  post: { ttl: 60, useStampedeProtection: true, refreshProbability: 0.08 },
  
  // Comments - short TTL, high traffic
  comments: { ttl: 30, useStampedeProtection: true, refreshProbability: 0.1 },
  
  // Categories - long TTL, rarely changes
  categories: { ttl: 600, useStampedeProtection: true },
  category: { ttl: 600, useStampedeProtection: false },
  
  // Tags - long TTL, rarely changes
  tags: { ttl: 600, useStampedeProtection: true },
  tag: { ttl: 600, useStampedeProtection: false },
  
  // Providers - moderate TTL
  providers: { ttl: 300, useStampedeProtection: true },
  provider: { ttl: 600, useStampedeProtection: false },
  
  // Resources - moderate TTL
  resources: { ttl: 300, useStampedeProtection: true },
  resource: { ttl: 600, useStampedeProtection: false },
  
  // Search results - short TTL
  search: { ttl: 60, useStampedeProtection: true, refreshProbability: 0.1 },
  
  // Session data - short TTL
  session: { ttl: 60, useStampedeProtection: false },
  
  // Feature flags - long TTL
  featureFlags: { ttl: 300, useStampedeProtection: false },
};

// Cache instance registry
const cacheRegistry = new Map<string, Cache | StampedeProtectedCache>();

/**
 * Get or create cache instance for entity type
 */
function getCache(entityType: string, customConfig?: Partial<CacheConfig>): Cache | StampedeProtectedCache {
  const config = { ...DEFAULT_CONFIGS[entityType], ...customConfig };
  
  // Create unique key based on config
  const cacheKey = `${entityType}:${config.ttl}:${config.useStampedeProtection}`;
  
  if (!cacheRegistry.has(cacheKey)) {
    if (config.useStampedeProtection) {
      cacheRegistry.set(
        cacheKey,
        new StampedeProtectedCache(entityType, config.ttl, {
          earlyExpirationWindow: config.earlyExpirationWindow,
          refreshProbability: config.refreshProbability,
        })
      );
    } else {
      cacheRegistry.set(cacheKey, new Cache(entityType, config.ttl));
    }
  }
  
  return cacheRegistry.get(cacheKey)!;
}

/**
 * Generate consistent cache key
 */
function generateKey(key: string | Record<string, unknown>): string {
  if (typeof key === "string") {
    return key;
  }
  // Sort keys for consistency
  const sorted = Object.keys(key)
    .sort()
    .reduce((acc, k) => {
      const value = key[k];
      if (value !== undefined && value !== null) {
        acc[k] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  
  return JSON.stringify(sorted);
}

/**
 * Cache-Aside Service
 * 
 * Provides consistent caching across all application services.
 */
export const CacheAsideService = {
  /**
   * Get data from cache or fetch from source
   * 
   * @param entityType - Type of entity (e.g., 'user', 'posts', 'categories')
   * @param key - Cache key (string or object)
   * @param fetchFn - Function to fetch data if cache miss
   * @param options - Optional cache configuration
   * @returns Cached or fresh data
   */
  async get<T>(
    entityType: string,
    key: string | Record<string, unknown>,
    fetchFn: () => Promise<T>,
    options?: Partial<CacheConfig>
  ): Promise<T> {
    const cacheKey = generateKey(key);
    const cache = getCache(entityType, options);
    
    // Check if using stampede protection
    if (cache instanceof StampedeProtectedCache) {
      const result = await cache.get(cacheKey, async () => {
        const startTime = Date.now();
        const data = await fetchFn();
        const fetchTime = Date.now() - startTime;
        CacheAnalytics.recordMiss(entityType, cacheKey, fetchTime);
        return data;
      });
      // Record hit if we got cached data (not fresh)
      if (result !== null && result !== undefined) {
        CacheAnalytics.recordHit(entityType, cacheKey);
      }
      return result;
    }
    
    // Standard cache-aside pattern
    const cached = await cache.get(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached) as T;
        CacheAnalytics.recordHit(entityType, cacheKey);
        return data;
      } catch {
        // Invalid cache entry, treat as miss
      }
    }
    
    // Cache miss - fetch from source
    const startTime = Date.now();
    const data = await fetchFn();
    const fetchTime = Date.now() - startTime;
    
    CacheAnalytics.recordMiss(entityType, cacheKey, fetchTime);
    
    // Store in cache (fire and forget)
    if (data !== null && data !== undefined) {
      cache.set(cacheKey, JSON.stringify(data)).catch((error) => {
        console.warn(`[CacheAside] Failed to cache ${entityType}:${cacheKey}:`, error);
      });
    }
    
    return data;
  },

  /**
   * Get data from cache only (no fetch on miss)
   * 
   * @param entityType - Type of entity
   * @param key - Cache key
   * @returns Cached data or null
   */
  async getRaw<T>(
    entityType: string,
    key: string | Record<string, unknown>
  ): Promise<T | null> {
    const cacheKey = generateKey(key);
    const cache = getCache(entityType);
    
    if (cache instanceof StampedeProtectedCache) {
      return cache.getRaw<T>(cacheKey);
    }
    
    const cached = await cache.get(cacheKey);
    if (!cached) return null;
    
    try {
      return JSON.parse(cached) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set data in cache directly
   * 
   * @param entityType - Type of entity
   * @param key - Cache key
   * @param data - Data to cache
   * @param options - Optional cache configuration
   */
  async set<T>(
    entityType: string,
    key: string | Record<string, unknown>,
    data: T,
    options?: Partial<CacheConfig>
  ): Promise<void> {
    const cacheKey = generateKey(key);
    const cache = getCache(entityType, options);
    
    if (cache instanceof StampedeProtectedCache) {
      await cache.set(cacheKey, data);
    } else {
      await cache.set(cacheKey, JSON.stringify(data));
    }
  },

  /**
   * Invalidate a specific cache entry
   * 
   * @param entityType - Type of entity
   * @param key - Cache key to invalidate
   */
  async invalidate(
    entityType: string,
    key: string | Record<string, unknown>
  ): Promise<void> {
    const cacheKey = generateKey(key);
    const cache = getCache(entityType);
    await cache.delete(cacheKey);
  },

  /**
   * Invalidate cache entries by pattern
   * 
   * @param entityType - Type of entity
   * @param pattern - Pattern to match (e.g., "feed:user123:*")
   */
  async invalidatePattern(entityType: string, pattern: string): Promise<void> {
    const fullPattern = `cache:${entityType}:${pattern}`;
    await invalidateCachePattern(fullPattern);
  },

  /**
   * Clear all cache entries for an entity type
   * 
   * @param entityType - Type of entity to clear
   */
  async clear(entityType: string): Promise<void> {
    const cache = getCache(entityType);
    await cache.clear();
  },

  /**
   * Get cache statistics
   * 
   * @param entityType - Type of entity (optional, returns all if not specified)
   */
  getStats(entityType?: string): Array<{
    entityType: string;
    ttl: number;
    useStampedeProtection: boolean;
    stampedeStats?: ReturnType<StampedeProtectedCache["getStats"]>;
  }> {
    const stats: ReturnType<typeof this.getStats> = [];
    
    for (const [key, cache] of cacheRegistry) {
      const [type, ttl, useStampede] = key.split(":");
      if (!entityType || type === entityType) {
        stats.push({
          entityType: type,
          ttl: parseInt(ttl, 10),
          useStampedeProtection: useStampede === "true",
          stampedeStats: cache instanceof StampedeProtectedCache
            ? cache.getStats()
            : undefined,
        });
      }
    }
    
    return stats;
  },

  /**
   * Warm cache for a specific entity
   * 
   * @param entityType - Type of entity
   * @param key - Cache key
   * @param fetchFn - Function to fetch data
   */
  async warm<T>(
    entityType: string,
    key: string | Record<string, unknown>,
    fetchFn: () => Promise<T>
  ): Promise<void> {
    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      await this.set(entityType, key, data);
    }
  },
};

/**
 * Decorator for caching service methods
 * 
 * Usage:
 *   class UserService {
 *     @Cacheable("user", 300)
 *     async getUser(id: string) {
 *       return await prisma.user.findUnique({ where: { id } });
 *     }
 *   }
 */
export function Cacheable(
  entityType: string,
  ttl?: number,
  options?: Partial<CacheConfig>
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      // Generate key from method name and arguments
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      return CacheAsideService.get(
        entityType,
        key,
        () => originalMethod.apply(this, args),
        { ...options, ttl }
      );
    };
    
    return descriptor;
  };
}

/**
 * Decorator for cache invalidation on mutation
 * 
 * Usage:
 *   class UserService {
 *     @CacheInvalidate("user")
 *     async updateUser(id: string, data: UpdateUserInput) {
 *       // After successful update, cache is invalidated
 *       return await prisma.user.update({ where: { id }, data });
 *     }
 *   }
 */
export function CacheInvalidate(entityType: string, keyIndex?: number) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);
      
      // Determine key to invalidate
      let key: string | Record<string, unknown>;
      if (keyIndex !== undefined && args[keyIndex] !== undefined) {
        key = String(args[keyIndex]);
      } else {
        key = `${propertyKey}:${JSON.stringify(args)}`;
      }
      
      // Invalidate cache
      await CacheAsideService.invalidate(entityType, key);
      
      return result;
    };
    
    return descriptor;
  };
}
