/**
 * Cache Analytics
 * 
 * Tracks cache hit/miss rates, latency, and other metrics for cache performance monitoring.
 * 
 * Features:
 * - Hit/miss ratio tracking per cache type
 * - Latency measurements (cache vs database)
 * - Memory usage tracking
 * - Top keys tracking
 * - Export to Prometheus/monitoring systems
 * 
 * Usage:
 *   import { CacheAnalytics } from "@/lib/cache-analytics";
 *   
 *   // Record cache hit
 *   CacheAnalytics.recordHit("posts", "feed:page1");
 *   
 *   // Record cache miss
 *   CacheAnalytics.recordMiss("posts", "feed:page1", 150); // 150ms DB fetch time
 * 
 *   // Get stats
 *   const stats = CacheAnalytics.getStats("posts");
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger({ context: "CacheAnalytics" });

// Metrics for a single cache type
interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  missRate: number;
  avgFetchTimeMs: number;
  totalFetchTimeMs: number;
  fetchCount: number;
  topKeys: Map<string, KeyMetrics>;
  lastUpdated: Date;
}

// Metrics for individual keys
interface KeyMetrics {
  key: string;
  hits: number;
  misses: number;
  lastAccessed: Date;
}

// In-memory storage (consider Redis for distributed tracking)
const metricsStore = new Map<string, CacheMetrics>();
const MAX_TOP_KEYS = 100;

// Global stats
let globalStats = {
  totalHits: 0,
  totalMisses: 0,
  totalRequests: 0,
  startTime: Date.now(),
};

/**
 * Initialize or get metrics for a cache type
 */
function getMetrics(cacheType: string): CacheMetrics {
  if (!metricsStore.has(cacheType)) {
    metricsStore.set(cacheType, {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      missRate: 0,
      avgFetchTimeMs: 0,
      totalFetchTimeMs: 0,
      fetchCount: 0,
      topKeys: new Map(),
      lastUpdated: new Date(),
    });
  }
  return metricsStore.get(cacheType)!;
}

/**
 * Update hit/miss rates
 */
function updateRates(metrics: CacheMetrics): void {
  if (metrics.totalRequests > 0) {
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
    metrics.missRate = (metrics.misses / metrics.totalRequests) * 100;
  }
  metrics.lastUpdated = new Date();
}

/**
 * Update average fetch time
 */
function updateAvgFetchTime(metrics: CacheMetrics, fetchTimeMs: number): void {
  metrics.totalFetchTimeMs += fetchTimeMs;
  metrics.fetchCount++;
  metrics.avgFetchTimeMs = metrics.totalFetchTimeMs / metrics.fetchCount;
}

/**
 * Track key access
 */
function trackKey(metrics: CacheMetrics, key: string, isHit: boolean): void {
  let keyMetrics = metrics.topKeys.get(key);
  
  if (!keyMetrics) {
    // Limit number of tracked keys
    if (metrics.topKeys.size >= MAX_TOP_KEYS) {
      // Remove least used key
      let leastUsed: KeyMetrics | null = null;
      for (const km of metrics.topKeys.values()) {
        if (!leastUsed || km.hits + km.misses < leastUsed.hits + leastUsed.misses) {
          leastUsed = km;
        }
      }
      if (leastUsed) {
        metrics.topKeys.delete(leastUsed.key);
      }
    }
    
    keyMetrics = {
      key,
      hits: 0,
      misses: 0,
      lastAccessed: new Date(),
    };
    metrics.topKeys.set(key, keyMetrics);
  }
  
  keyMetrics.lastAccessed = new Date();
  if (isHit) {
    keyMetrics.hits++;
  } else {
    keyMetrics.misses++;
  }
}

export const CacheAnalytics = {
  /**
   * Record a cache hit
   */
  recordHit(cacheType: string, key: string): void {
    const metrics = getMetrics(cacheType);
    metrics.hits++;
    metrics.totalRequests++;
    globalStats.totalHits++;
    globalStats.totalRequests++;
    
    trackKey(metrics, key, true);
    updateRates(metrics);
  },

  /**
   * Record a cache miss
   * @param fetchTimeMs - Time taken to fetch from database (optional)
   */
  recordMiss(cacheType: string, key: string, fetchTimeMs?: number): void {
    const metrics = getMetrics(cacheType);
    metrics.misses++;
    metrics.totalRequests++;
    globalStats.totalMisses++;
    globalStats.totalRequests++;
    
    trackKey(metrics, key, false);
    
    if (fetchTimeMs !== undefined) {
      updateAvgFetchTime(metrics, fetchTimeMs);
    }
    
    updateRates(metrics);
  },

  /**
   * Get stats for a specific cache type
   */
  getStats(cacheType: string): {
    cacheType: string;
    hits: number;
    misses: number;
    hitRate: number;
    missRate: number;
    avgFetchTimeMs: number;
    topKeys: Array<{ key: string; hits: number; misses: number; hitRate: number }>;
    lastUpdated: Date;
  } | null {
    const metrics = metricsStore.get(cacheType);
    if (!metrics) return null;

    const topKeys = Array.from(metrics.topKeys.values())
      .sort((a, b) => b.hits + b.misses - (a.hits + a.misses))
      .slice(0, 10)
      .map((k) => ({
        key: k.key,
        hits: k.hits,
        misses: k.misses,
        hitRate: k.hits + k.misses > 0 ? (k.hits / (k.hits + k.misses)) * 100 : 0,
      }));

    return {
      cacheType,
      hits: metrics.hits,
      misses: metrics.misses,
      hitRate: Math.round(metrics.hitRate * 100) / 100,
      missRate: Math.round(metrics.missRate * 100) / 100,
      avgFetchTimeMs: Math.round(metrics.avgFetchTimeMs * 100) / 100,
      topKeys,
      lastUpdated: metrics.lastUpdated,
    };
  },

  /**
   * Get all cache stats
   */
  getAllStats(): Array<ReturnType<typeof this.getStats>> {
    return Array.from(metricsStore.keys())
      .map((type) => this.getStats(type))
      .filter((s): s is NonNullable<typeof s> => s !== null);
  },

  /**
   * Get global stats
   */
  getGlobalStats(): {
    totalHits: number;
    totalMisses: number;
    totalRequests: number;
    globalHitRate: number;
    globalMissRate: number;
    uptimeSeconds: number;
    cacheTypes: number;
  } {
    const uptimeSeconds = Math.floor((Date.now() - globalStats.startTime) / 1000);
    const totalRequests = globalStats.totalHits + globalStats.totalMisses;
    
    return {
      totalHits: globalStats.totalHits,
      totalMisses: globalStats.totalMisses,
      totalRequests,
      globalHitRate: totalRequests > 0 
        ? Math.round((globalStats.totalHits / totalRequests) * 10000) / 100 
        : 0,
      globalMissRate: totalRequests > 0 
        ? Math.round((globalStats.totalMisses / totalRequests) * 10000) / 100 
        : 0,
      uptimeSeconds,
      cacheTypes: metricsStore.size,
    };
  },

  /**
   * Reset stats for a cache type
   */
  resetStats(cacheType?: string): void {
    if (cacheType) {
      metricsStore.delete(cacheType);
    } else {
      metricsStore.clear();
      globalStats = {
        totalHits: 0,
        totalMisses: 0,
        totalRequests: 0,
        startTime: Date.now(),
      };
    }
  },

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    
    // Global metrics
    const global = this.getGlobalStats();
    lines.push(`# HELP cache_hits_total Total cache hits`);
    lines.push(`# TYPE cache_hits_total counter`);
    lines.push(`cache_hits_total ${global.totalHits}`);
    
    lines.push(`# HELP cache_misses_total Total cache misses`);
    lines.push(`# TYPE cache_misses_total counter`);
    lines.push(`cache_misses_total ${global.totalMisses}`);
    
    lines.push(`# HELP cache_hit_rate Cache hit rate percentage`);
    lines.push(`# TYPE cache_hit_rate gauge`);
    lines.push(`cache_hit_rate ${global.globalHitRate}`);
    
    // Per-cache-type metrics
    for (const [type, metrics] of metricsStore) {
      lines.push(`cache_hits_total{type="${type}"} ${metrics.hits}`);
      lines.push(`cache_misses_total{type="${type}"} ${metrics.misses}`);
      lines.push(`cache_hit_rate{type="${type}"} ${metrics.hitRate}`);
      lines.push(`cache_avg_fetch_time_ms{type="${type}"} ${metrics.avgFetchTimeMs}`);
    }
    
    return lines.join("\n");
  },

  /**
   * Log current stats (useful for debugging)
   */
  logStats(): void {
    const global = this.getGlobalStats();
    logger.info({
      global,
      caches: this.getAllStats().map((s) => ({
        type: s?.cacheType,
        hitRate: s?.hitRate,
        hits: s?.hits,
        misses: s?.misses,
      })),
    }, "Cache analytics summary");
  },
};

// Auto-log stats every 5 minutes in production
if (process.env.NODE_ENV === "production") {
  setInterval(() => {
    CacheAnalytics.logStats();
  }, 5 * 60 * 1000);
}
