/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for Edge Runtime (middleware, edge API routes)
 * Edge Runtime has limited Node.js APIs available.
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize if DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment
    environment: process.env.SENTRY_ENVIRONMENT || "production",

    // Performance Monitoring
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
    ),

    // Edge-specific: minimal configuration
    // No local variables in edge runtime
    includeLocalVariables: false,
  });
} else {
  console.log("[Sentry] DSN not configured - skipping edge initialization");
}
