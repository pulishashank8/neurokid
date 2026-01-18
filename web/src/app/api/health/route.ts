import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnv, isRedisAvailable, isAIEnabled, isProduction } from "@/lib/env";

/**
 * Enhanced health check endpoint for production monitoring
 * Verifies:
 * - Database connectivity
 * - Redis availability (optional)
 * - AI features availability (optional)
 * - Environment configuration
 * - Memory usage and uptime
 *
 * GET /api/health
 * GET /api/health?detailed=true (includes timing)
 */

export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get("detailed") === "true";
  const result: any = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    uptime: process.uptime(),
    environment: isProduction() ? "production" : "development",
  };

  const timings: Record<string, number> = {};

  try {
    // 1. Verify environment is configured
    const env = getEnv();
    result.config = { ready: true };

    // 2. Check database connectivity
    const dbStart = performance.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      timings.database_ms = Math.round(performance.now() - dbStart);
      result.database = "ok";
    } catch (error) {
      result.database = "error";
      result.status = "degraded";
      result.error = String(error);
    }

    // 3. Check Redis (optional)
    if (isRedisAvailable()) {
      try {
        const redisStart = performance.now();
        const { Redis } = await import("ioredis");
        const client = new Redis(env.REDIS_URL!, {
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
        });
        await client.ping();
        await client.disconnect();
        timings.redis_ms = Math.round(performance.now() - redisStart);
        result.redis = "ok";
      } catch (error) {
        result.redis = "unavailable";
        result.redisError = String(error);
        // Not critical; don't degrade status
      }
    } else {
      result.redis = "not_configured";
    }

    // 4. Check AI features (optional)
    result.aiFeatures = isAIEnabled() ? "enabled" : "disabled";

    // 5. Memory usage
    if (typeof process !== "undefined" && process.memoryUsage) {
      const mem = process.memoryUsage();
      result.memory = {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024),
      };
    }

    if (detailed) {
      result.timings = timings;
    }

    const statusCode = result.status === "healthy" ? 200 : 503;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: errorMessage,
        environment: isProduction() ? "production" : "development",
      },
      { status: 500 }
    );
  }
}
