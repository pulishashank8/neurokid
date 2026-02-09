/**
 * Next.js Instrumentation
 * 
 * This file is used to register instrumentation hooks for the application.
 * It's called when the Next.js server starts.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { initMonitoring } from "@/lib/monitoring";

export async function register() {
  // Initialize security monitoring (Sentry, etc.)
  initMonitoring();

  // Dynamically import Sentry configs based on runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js runtime
    await import("./sentry.server.config");
    
    // Warm caches on startup (non-blocking)
    // This pre-loads hot data like categories, tags, providers into Redis
    await warmCachesAsync();
    
    // Initialize cache event bus for cross-instance invalidation
    // This enables distributed cache consistency across multiple server instances
    await initializeCacheEventsAsync();
  } else if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime
    await import("./sentry.edge.config");
  }
}

/**
 * Warm caches asynchronously on startup
 * This runs in the background and doesn't block server startup
 */
async function warmCachesAsync(): Promise<void> {
  try {
    // Dynamic import to avoid issues if the module has issues
    const { warmCachesOnStartup } = await import("@/lib/cache-warming");
    await warmCachesOnStartup();
  } catch (error) {
    // Log but don't fail startup - cache warming is optimization, not critical
    console.warn("[Instrumentation] Cache warming failed (non-critical):", error);
  }
}

/**
 * Initialize cache event bus for cross-instance invalidation
 * This enables distributed cache consistency across multiple server instances
 */
async function initializeCacheEventsAsync(): Promise<void> {
  try {
    const { initializeCacheEvents } = await import("@/lib/cache-events");
    await initializeCacheEvents();
  } catch (error) {
    // Log but don't fail startup - cache events are optimization, not critical
    console.warn("[Instrumentation] Cache events init failed (non-critical):", error);
  }
}

export const onRequestError = async (
  err: Error,
  request: Request,
  context: { routePath: string }
) => {
  // Capture error in Sentry
  if (process.env.SENTRY_DSN) {
    const { captureException } = await import("@sentry/nextjs");
    captureException(err, {
      contexts: {
        request: {
          url: request.url,
          method: request.method,
        },
        route: {
          path: context.routePath,
        },
      },
    });
  }

  // Log to console for server logs
  console.error("[Request Error]", {
    error: err.message,
    url: request.url,
    route: context.routePath,
    stack: err.stack,
  });
};
