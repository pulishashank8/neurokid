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
  } else if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime
    await import("./sentry.edge.config");
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

  // Create AdminNotification for owner dashboard
  try {
    const { createAdminNotification } = await import("@/lib/owner/create-admin-notification");
    await createAdminNotification({
      type: "system_error",
      severity: "critical",
      message: `Request error: ${err.message}`,
      relatedEntity: context.routePath,
      metadata: { url: request.url, method: request.method },
    });
  } catch (notifErr) {
    console.error("[Request Error] Failed to create admin notification:", notifErr);
  }
};
