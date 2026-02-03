/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for server-side code (API routes, SSR, etc.)
 * Captures server errors and performance data.
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize if DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment
    environment: process.env.SENTRY_ENVIRONMENT || "production",

    // Enable debug in development
    debug: process.env.NODE_ENV === "development",

    // Performance Monitoring - lower rate on server
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
    ),

    // Server-specific settings
    // Don't capture local variables to avoid leaking PHI
    includeLocalVariables: false,

    // Before sending, sanitize to ensure HIPAA compliance
    beforeSend(event) {
      // Remove request data that might contain PHI
      if (event.request) {
        // Keep only method and URL (no headers, cookies, or data)
        event.request = {
          method: event.request.method,
          url: event.request.url,
        };
      }

      // Sanitize user data
      if (event.user) {
        event.user = {
          id: event.user.id,
          // Exclude email, ip_address, and other identifiers
        };
      }

      // Remove breadcrumbs that might contain sensitive URLs or data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          // Sanitize HTTP request breadcrumbs
          if (crumb.category === "http" && crumb.data?.url) {
            // Remove query params that might contain sensitive data
            try {
              const url = new URL(crumb.data.url);
              crumb.data.url = url.pathname;
            } catch {
              // Invalid URL, keep as-is
            }
          }
          return crumb;
        });
      }

      return event;
    },
  });
} else {
  console.log("[Sentry] DSN not configured - skipping server initialization");
}
