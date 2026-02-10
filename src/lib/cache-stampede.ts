/**
 * Cache Stampede Protection
 * 
 * Prevents cache stampedes (thundering herd) when hot cache entries expire.
 * Uses probabilistic early expiration (also known as "x-fetch" or "early recomputation").
 * 
 * How it works:
 * 1. Before a cache entry expires, there's a recompute window (e.g., last 10% of TTL)
 * 2. During this window, a small percentage of requests trigger background refresh
 * 3. Most requests still get the cached (slightly stale) value immediately
 * 4. This ensures only 1-2 requests refresh the cache, not thousands
 * 
 * Benefits:
 * - Prevents database overload when popular cache entries expire
 * - Smooth degradation under high load
 * - No additional infrastructure (locks, semaphores) needed
 * 
 * Usage:
 *   import { StampedeProtectedCache } from "@/lib/cache-stampede";
 *   
 *   const cache = new StampedeProtectedCache("posts", 60); // 60s TTL
 *   
 *   // Automatic stampede protection on every get
 *   const data = await cache.get("hot-key", async () => {
 *     return await fetchFromDatabase();
 *   });
 */

import { Cache } from "@/lib/cache";

// Configuration for stampede protection
interface StampedeConfig {
  /** Percentage of TTL before expiration to start early recomputation (0-1) */
  earlyExpirationWindow: number;
  /** Probability of triggering refresh during early window (0-1) */
  refreshProbability: number;
  /** Minimum time between refresh attempts (ms) to prevent excessive refreshes */
  minRefreshInterval: number;
}

// Metadata stored alongside cached value
interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  ttlSeconds: number;
  refreshInProgress?: boolean;
  lastRefreshAttempt?: number;
}

// Default configuration - tuned for production
const DEFAULT_CONFIG: StampedeConfig = {
  // Start early expiration at 80% of TTL (last 20% of lifetime)
  earlyExpirationWindow: 0.2,
  // 10% chance to trigger refresh during early window
  refreshProbability: 0.1,
  // Max 1 refresh attempt per 5 seconds per key
  minRefreshInterval: 5000,
};

// In-memory tracking of background refresh promises
const refreshPromises = new Map<string, Promise<unknown>>();

/**
 * Calculate if we should trigger early recomputation
 */
function shouldTriggerRefresh<T>(
  entry: CacheEntry<T>,
  config: StampedeConfig
): boolean {
  const now = Date.now();
  const ageMs = now - entry.cachedAt;
  const ttlMs = entry.ttlSeconds * 1000;
  const remainingMs = ttlMs - ageMs;
  
  // Already expired
  if (remainingMs <= 0) return true;
  
  // Check if we're in the early expiration window
  const earlyWindowMs = ttlMs * config.earlyExpirationWindow;
  const isInEarlyWindow = remainingMs < earlyWindowMs;
  
  if (!isInEarlyWindow) return false;
  
  // Check minimum refresh interval
  if (entry.lastRefreshAttempt) {
    const timeSinceLastRefresh = now - entry.lastRefreshAttempt;
    if (timeSinceLastRefresh < config.minRefreshInterval) {
      return false;
    }
  }
  
  // Probabilistic decision - spread refreshes across requests
  return Math.random() < config.refreshProbability;
}

/**
 * Generate unique key for tracking refresh promises
 */
function getRefreshKey(cacheName: string, key: string): string {
  return `${cacheName}:${key}`;
}

/**
 * Stampede-protected cache wrapper
 * 
 * This extends the base Cache class with automatic stampede protection.
 * When a cached value is near expiration, only a small percentage of
 * requests will trigger a background refresh.
 */
export class StampedeProtectedCache {
  private cache: Cache;
  private config: StampedeConfig;

  constructor(
    name: string,
    ttlSeconds: number = 300,
    config: Partial<StampedeConfig> = {}
  ) {
    this.cache = new Cache(name, ttlSeconds);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get value from cache with automatic stampede protection
   * 
   * @param key - Cache key
   * @param fetchFn - Function to fetch fresh data if cache miss or early expiration
   * @returns Cached or fresh value
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const fullKey = `stampede:${this.cache.name}:${key}`;
    
    // Try to get from cache
    const cached = await this.getCacheEntry<T>(key);
    
    if (cached) {
      // Check if we should trigger early refresh
      if (shouldTriggerRefresh(cached, this.config)) {
        // Trigger background refresh without awaiting
        this.backgroundRefresh(key, fetchFn, cached).catch((error) => {
          console.warn(`[CacheStampede] Background refresh failed for ${fullKey}:`, error);
        });
      }
      
      // Return cached value immediately (may be slightly stale)
      return cached.value;
    }
    
    // Cache miss - fetch and cache
    return this.fetchAndCache(key, fetchFn);
  }

  /**
   * Get value without stampede protection (raw cache access)
   */
  async getRaw<T>(key: string): Promise<T | null> {
    const entry = await this.getCacheEntry<T>(key);
    return entry?.value ?? null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
    const ttl = customTtl ?? this.cache.ttlSeconds;
    const entry: CacheEntry<T> = {
      value,
      cachedAt: Date.now(),
      ttlSeconds: ttl,
    };
    
    await this.cache.set(key, JSON.stringify(entry));
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
    const refreshKey = getRefreshKey(this.cache.name, key);
    refreshPromises.delete(refreshKey);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    // Clear any pending refresh promises for this cache
    for (const [key] of refreshPromises) {
      if (key.startsWith(`${this.cache.name}:`)) {
        refreshPromises.delete(key);
      }
    }
    await this.cache.clear();
  }

  /**
   * Get cache entry with metadata
   */
  private async getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const cached = await this.cache.get(key);
    if (!cached) return null;
    
    try {
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if actually expired
      const ageMs = Date.now() - entry.cachedAt;
      const ttlMs = entry.ttlSeconds * 1000;
      
      if (ageMs > ttlMs) {
        // Truly expired
        return null;
      }
      
      return entry;
    } catch {
      // Legacy cache entry without metadata - treat as miss
      return null;
    }
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const refreshKey = getRefreshKey(this.cache.name, key);
    
    // Check if there's already a refresh in progress
    const existingPromise = refreshPromises.get(refreshKey) as Promise<T> | undefined;
    if (existingPromise) {
      return existingPromise;
    }
    
    // Create new fetch promise
    const fetchPromise = this.executeFetch(key, fetchFn, customTtl);
    refreshPromises.set(refreshKey, fetchPromise);
    
    try {
      const result = await fetchPromise;
      return result;
    } finally {
      refreshPromises.delete(refreshKey);
    }
  }

  /**
   * Execute fetch and store result
   */
  private async executeFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const value = await fetchFn();
    await this.set(key, value, customTtl);
    return value;
  }

  /**
   * Background refresh - doesn't block returning cached value
   */
  private async backgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    existingEntry: CacheEntry<T>
  ): Promise<void> {
    const refreshKey = getRefreshKey(this.cache.name, key);
    
    // Skip if refresh already in progress
    if (refreshPromises.has(refreshKey)) {
      return;
    }
    
    // Update last refresh attempt time
    existingEntry.lastRefreshAttempt = Date.now();
    
    // Perform refresh
    try {
      await this.fetchAndCache(key, fetchFn);
      console.log(`[CacheStampede] Background refresh completed for ${refreshKey}`);
    } catch (error) {
      console.warn(`[CacheStampede] Background refresh failed for ${refreshKey}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    name: string;
    ttlSeconds: number;
    config: StampedeConfig;
    activeRefreshes: number;
  } {
    const activeRefreshes = Array.from(refreshPromises.keys()).filter((k) =>
      k.startsWith(`${this.cache.name}:`)
    ).length;
    
    return {
      name: this.cache.name,
      ttlSeconds: this.cache.ttlSeconds,
      config: this.config,
      activeRefreshes,
    };
  }
}

/**
 * Pre-configured stampede-protected caches for common use cases
 */
export const PROTECTED_CACHES = {
  /** Posts feed - high traffic, needs stampede protection */
  posts: new StampedeProtectedCache("posts", 45, {
    earlyExpirationWindow: 0.2,
    refreshProbability: 0.05, // 5% chance for posts (lower due to high traffic)
  }),
  
  /** Categories - stable data, moderate traffic */
  categories: new StampedeProtectedCache("categories", 600, {
    earlyExpirationWindow: 0.3,
    refreshProbability: 0.1,
  }),
  
  /** Tags - stable data, moderate traffic */
  tags: new StampedeProtectedCache("tags", 600, {
    earlyExpirationWindow: 0.3,
    refreshProbability: 0.1,
  }),
  
  /** User profiles - high traffic, critical */
  userProfiles: new StampedeProtectedCache("user_profiles", 300, {
    earlyExpirationWindow: 0.25,
    refreshProbability: 0.08,
  }),
  
  /** Comments - high traffic on popular posts */
  comments: new StampedeProtectedCache("comments", 30, {
    earlyExpirationWindow: 0.15,
    refreshProbability: 0.1,
  }),
};

/**
 * Helper function to wrap any fetch with stampede protection
 * Useful for one-off cache operations
 */
export async function withStampedeProtection<T>(
  cacheKey: string,
  cacheName: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
  config?: Partial<StampedeConfig>
): Promise<T> {
  const cache = new StampedeProtectedCache(cacheName, ttlSeconds, config);
  return cache.get(cacheKey, fetchFn);
}
