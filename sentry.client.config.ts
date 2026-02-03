/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for the browser/client-side.
 * It captures JavaScript errors, performance data, and user sessions.
 * 
 * Environment variables:
 *   SENTRY_DSN - Your Sentry project DSN
 *   SENTRY_ENVIRONMENT - production, staging, development
 *   SENTRY_TRACES_SAMPLE_RATE - Performance monitoring rate (0.0 - 1.0)
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",

    // Performance Monitoring
    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0.1"
    ),

    // Session Replay (optional - for understanding user behavior)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // Before sending, filter out PII (PHI protection for HIPAA)
    beforeSend(event) {
      // Remove potentially sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      
      // Sanitize user data
      if (event.user) {
        // Only keep non-sensitive user identifiers
        const safeUser = {
          id: event.user.id,
          // Don't include email, username, or other PHI
        };
        event.user = safeUser;
      }

      // Sanitize exception values (might contain form data)
      if (event.exception?.values) {
        event.exception.values.forEach((value) => {
          if (value.stacktrace?.frames) {
            value.stacktrace.frames.forEach((frame) => {
              // Remove vars that might contain sensitive data
              if (frame.vars) {
                delete frame.vars;
              }
            });
          }
        });
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Network errors
      "Network Error",
      "Failed to fetch",
      "NetworkError",
      // Browser extensions
      "chrome-extension",
      "webkit-masked-url",
      // Third-party scripts
      "Non-Error promise rejection",
    ],

    // Deny URLs from known problematic sources
    denyUrls: [
      // Extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Facebook/Meta scripts
      /connect\.facebook\.net/i,
    ],
  });
} else {
  console.log("[Sentry] DSN not configured - skipping client initialization");
}
