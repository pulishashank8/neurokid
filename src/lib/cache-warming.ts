/**
 * Cache Warming Service
 * 
 * Pre-loads hot data into cache on application startup to ensure
 * fast response times for frequently accessed, rarely changing data.
 * 
 * Hot data includes:
 * - Categories (stable reference data)
 * - Tags (stable reference data)
 * - Top providers (frequently accessed)
 * - Featured resources (frequently accessed)
 * 
 * Usage:
 *   import { CacheWarmingService } from "@/lib/cache-warming";
 *   
 *   // On startup
 *   await CacheWarmingService.warmAll();
 *   
 *   // Background refresh (e.g., every 5 minutes)
 *   setInterval(() => CacheWarmingService.warmAll(), 5 * 60 * 1000);
 */

import { prisma } from "@/lib/prisma";
import { setCached, CACHE_TTL, isRedisEnabled } from "@/lib/redis";
import { Cache } from "@/lib/cache";

// Warmable cache types
interface WarmableCache {
  name: string;
  cacheKey: string;
  prefix: string;
  ttl: number;
  warm: () => Promise<unknown>;
}

// Logger for cache warming operations
interface WarmResult {
  cache: string;
  status: "success" | "error" | "skipped";
  durationMs: number;
  recordCount?: number;
  error?: string;
}

class CacheWarmingServiceClass {
  private isWarming = false;
  private lastWarmAt: Date | null = null;
  private warmResults: WarmResult[] = [];

  /**
   * Get all warmable caches configuration
   */
  private getWarmableCaches(): WarmableCache[] {
    return [
      {
        name: "categories",
        cacheKey: "all",
        prefix: "categories",
        ttl: CACHE_TTL.CATEGORIES,
        warm: this.warmCategories.bind(this),
      },
      {
        name: "tags",
        cacheKey: "all",
        prefix: "tags",
        ttl: CACHE_TTL.TAGS,
        warm: this.warmTags.bind(this),
      },
      {
        name: "providers_top",
        cacheKey: "top",
        prefix: "providers",
        ttl: 300, // 5 minutes for providers
        warm: this.warmTopProviders.bind(this),
      },
      {
        name: "resources_featured",
        cacheKey: "featured",
        prefix: "resources",
        ttl: 600, // 10 minutes for resources
        warm: this.warmFeaturedResources.bind(this),
      },
    ];
  }

  /**
   * Warm categories cache
   */
  private async warmCategories(): Promise<unknown> {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        order: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: category.order,
      postCount: category._count.posts,
    }));

    return { categories: formattedCategories };
  }

  /**
   * Warm tags cache
   */
  private async warmTags(): Promise<unknown> {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      postCount: tag._count.posts,
    }));

    return { tags: formattedTags };
  }

  /**
   * Warm top providers cache (verified providers sorted by rating)
   */
  private async warmTopProviders(): Promise<unknown> {
    const providers = await prisma.provider.findMany({
      where: {
        isVerified: true,
      },
      orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
      take: 50, // Top 50 providers
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        specialties: true,
        rating: true,
        totalReviews: true,
        isVerified: true,
        website: true,
      },
    });

    const serializedProviders = providers.map((p) => ({
      ...p,
      rating: p.rating ? Number(p.rating) : null,
    }));

    return { providers: serializedProviders };
  }

  /**
   * Warm featured resources cache
   */
  private async warmFeaturedResources(): Promise<unknown> {
    const resources = await prisma.resource.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 20, // Top 20 resources
      select: {
        id: true,
        title: true,
        content: true,
        link: true,
        category: true,
        views: true,
        createdAt: true,
        creator: {
          select: {
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    const formattedResources = resources.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      link: r.link,
      category: r.category,
      views: r.views,
      createdAt: r.createdAt.toISOString(),
      authorName: r.creator?.profile?.displayName || null,
    }));

    return { resources: formattedResources };
  }

  /**
   * Warm a single cache entry
   */
  private async warmCache(warmable: WarmableCache): Promise<WarmResult> {
    const startTime = Date.now();

    try {
      // Skip if Redis is not available
      if (!isRedisEnabled()) {
        return {
          cache: warmable.name,
          status: "skipped",
          durationMs: Date.now() - startTime,
          error: "Redis not available",
        };
      }

      // Fetch data
      const data = await warmable.warm();
      const recordCount = Array.isArray(data) 
        ? data.length 
        : Object.values(data as Record<string, unknown>).find(v => Array.isArray(v))?.length || 0;

      // Store in cache
      await setCached(warmable.cacheKey, data, {
        prefix: warmable.prefix,
        ttl: warmable.ttl,
      });

      return {
        cache: warmable.name,
        status: "success",
        durationMs: Date.now() - startTime,
        recordCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[CacheWarming] Failed to warm ${warmable.name}:`, errorMessage);

      return {
        cache: warmable.name,
        status: "error",
        durationMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Warm all configured caches
   * This is the main entry point for cache warming
   */
  public async warmAll(): Promise<WarmResult[]> {
    // Prevent concurrent warming
    if (this.isWarming) {
      console.log("[CacheWarming] Skipping: already warming");
      return this.warmResults;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      console.log("[CacheWarming] Starting cache warming...");

      const caches = this.getWarmableCaches();
      const results: WarmResult[] = [];

      // Warm caches sequentially to avoid overwhelming the database
      for (const cache of caches) {
        const result = await this.warmCache(cache);
        results.push(result);
      }

      this.warmResults = results;
      this.lastWarmAt = new Date();

      const successCount = results.filter((r) => r.status === "success").length;
      const errorCount = results.filter((r) => r.status === "error").length;
      const skippedCount = results.filter((r) => r.status === "skipped").length;
      const totalDuration = Date.now() - startTime;

      console.log(
        `[CacheWarming] Complete: ${successCount} success, ${errorCount} error, ${skippedCount} skipped (${totalDuration}ms)`
      );

      return results;
    } catch (error) {
      console.error("[CacheWarming] Unexpected error:", error);
      throw error;
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm a specific cache by name
   */
  public async warmByName(cacheName: string): Promise<WarmResult | null> {
    const cache = this.getWarmableCaches().find((c) => c.name === cacheName);
    if (!cache) {
      console.warn(`[CacheWarming] Unknown cache: ${cacheName}`);
      return null;
    }

    return this.warmCache(cache);
  }

  /**
   * Get the current warming status
   */
  public getStatus(): {
    isWarming: boolean;
    lastWarmAt: Date | null;
    results: WarmResult[];
  } {
    return {
      isWarming: this.isWarming,
      lastWarmAt: this.lastWarmAt,
      results: this.warmResults,
    };
  }

  /**
   * Schedule periodic cache warming
   * @param intervalMs - Interval in milliseconds (default: 5 minutes)
   */
  public scheduleWarming(intervalMs: number = 5 * 60 * 1000): void {
    console.log(`[CacheWarming] Scheduled warming every ${intervalMs}ms`);
    
    // Initial warm
    this.warmAll().catch(console.error);

    // Schedule periodic warming
    setInterval(() => {
      this.warmAll().catch(console.error);
    }, intervalMs);
  }
}

// Export singleton instance
export const CacheWarmingService = new CacheWarmingServiceClass();

// Convenience function for startup warming
export async function warmCachesOnStartup(): Promise<void> {
  try {
    await CacheWarmingService.warmAll();
  } catch (error) {
    // Log but don't fail startup - cache warming is optimization, not critical
    console.error("[CacheWarming] Startup warming failed (non-critical):", error);
  }
}
