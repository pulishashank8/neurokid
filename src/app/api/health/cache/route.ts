/**
 * Cache Health Endpoint
 * 
 * Provides visibility into cache warming and stampede protection status.
 * 
 * GET /api/health/cache
 */

import { NextResponse } from "next/server";
import { CacheWarmingService } from "@/lib/cache-warming";
import { PROTECTED_CACHES } from "@/lib/cache-stampede";
import { isRedisEnabled } from "@/lib/redis";
import { CacheEventBus } from "@/lib/cache-events";
import { CacheAnalytics } from "@/lib/cache-analytics";
import { createLogger } from "@/lib/logger";

export async function GET() {
  try {
    const warmingStatus = CacheWarmingService.getStatus();
    
    // Get stats for all protected caches
    const protectedCacheStats = Object.entries(PROTECTED_CACHES).map(
      ([cacheName, cache]) => {
        const stats = cache.getStats();
        return {
          name: cacheName,
          ttlSeconds: stats.ttlSeconds,
          config: stats.config,
          activeRefreshes: stats.activeRefreshes,
        };
      }
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      redis: isRedisEnabled() ? "connected" : "not_configured",
      cacheWarming: {
        isWarming: warmingStatus.isWarming,
        lastWarmAt: warmingStatus.lastWarmAt?.toISOString() || null,
        results: warmingStatus.results,
      },
      stampedeProtection: {
        enabled: true,
        protectedCaches: protectedCacheStats,
      },
      cacheEvents: CacheEventBus.getStats(),
      analytics: {
        global: CacheAnalytics.getGlobalStats(),
        byCacheType: CacheAnalytics.getAllStats(),
      },
    });
  } catch (error) {
    const logger = createLogger({ context: 'CacheHealth' });
    logger.error({ error }, 'Error fetching cache status');
    
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: "Failed to fetch cache status",
        ...(isDev && { details: error instanceof Error ? error.message : String(error) }),
      },
      { status: 500 }
    );
  }
}
