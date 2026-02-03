/**
 * Security Monitoring & Error Tracking
 * 
 * Integrates with Sentry for:
 * - Error tracking and alerting
 * - Security event monitoring
 * - Performance monitoring
 * - User behavior analytics
 * 
 * Environment variables:
 *   SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
 *   SENTRY_ENVIRONMENT=production
 *   SENTRY_TRACES_SAMPLE_RATE=0.1
 */

import type { NextRequest } from "next/server";

// Security event types for structured logging
export type SecurityEventType =
  | "AUTH_FAILED"
  | "AUTH_SUCCESS"
  | "RATE_LIMIT_EXCEEDED"
  | "CSRF_VIOLATION"
  | "XSS_ATTEMPT"
  | "SQL_INJECTION_ATTEMPT"
  | "PRIVILEGE_ESCALATION"
  | "SUSPICIOUS_ACTIVITY"
  | "DATA_EXFILTRATION_ATTEMPT"
  | "BRUTE_FORCE_ATTEMPT"
  | "INVALID_TOKEN"
  | "ACCOUNT_LOCKED"
  | "SENSITIVE_DATA_ACCESS";

interface SecurityEvent {
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

/**
 * Log security event to monitoring system
 */
export async function logSecurityEvent(
  event: Omit<SecurityEvent, "timestamp" | "ipAddress">,
  request?: NextRequest
): Promise<void> {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    ipAddress: request?.headers.get("x-forwarded-for") ||
               request?.headers.get("x-real-ip") ||
               "unknown",
    userAgent: request?.headers.get("user-agent") || undefined,
  };

  // Console logging for immediate visibility
  const logMethod = event.severity === "critical" || event.severity === "high"
    ? console.error
    : event.severity === "medium"
    ? console.warn
    : console.log;

  logMethod("[SECURITY EVENT]", {
    type: fullEvent.type,
    severity: fullEvent.severity,
    userId: fullEvent.userId,
    ip: fullEvent.ipAddress,
    ...fullEvent.details,
  });

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/nextjs");
      
      Sentry.captureMessage(`Security Event: ${event.type}`, {
        level: severityToSentryLevel(event.severity),
        tags: {
          security_event: "true",
          event_type: event.type,
        },
        extra: {
          ...fullEvent.details,
          ip_address: fullEvent.ipAddress,
          user_agent: fullEvent.userAgent,
        },
        user: event.userId ? { id: event.userId } : undefined,
      });
    } catch (error) {
      console.error("Failed to send security event to Sentry:", error);
    }
  }

  // Send to external SIEM if webhook configured
  if (process.env.SECURITY_WEBHOOK_URL) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullEvent),
      });
    } catch (error) {
      console.error("Failed to send security event to webhook:", error);
    }
  }
}

/**
 * Track failed authentication attempt
 */
export async function trackAuthFailure(
  reason: string,
  identifier: string,
  request?: NextRequest
): Promise<void> {
  await logSecurityEvent(
    {
      type: "AUTH_FAILED",
      severity: "medium",
      details: { reason, identifier: maskIdentifier(identifier) },
    },
    request
  );
}

/**
 * Track successful authentication
 */
export async function trackAuthSuccess(
  userId: string,
  method: string,
  request?: NextRequest
): Promise<void> {
  await logSecurityEvent(
    {
      type: "AUTH_SUCCESS",
      severity: "low",
      userId,
      details: { method },
    },
    request
  );
}

/**
 * Track rate limit violation
 */
export async function trackRateLimit(
  endpoint: string,
  identifier: string,
  request?: NextRequest
): Promise<void> {
  await logSecurityEvent(
    {
      type: "RATE_LIMIT_EXCEEDED",
      severity: "medium",
      details: { endpoint, identifier: maskIdentifier(identifier) },
    },
    request
  );
}

/**
 * Track suspicious activity (potential attack)
 */
export async function trackSuspiciousActivity(
  activity: string,
  details: Record<string, unknown>,
  request?: NextRequest
): Promise<void> {
  await logSecurityEvent(
    {
      type: "SUSPICIOUS_ACTIVITY",
      severity: "high",
      details: { activity, ...details },
    },
    request
  );
}

/**
 * Track access to sensitive data
 */
export async function trackSensitiveDataAccess(
  userId: string,
  dataType: string,
  action: string,
  request?: NextRequest
): Promise<void> {
  await logSecurityEvent(
    {
      type: "SENSITIVE_DATA_ACCESS",
      severity: "low",
      userId,
      details: { data_type: dataType, action },
    },
    request
  );
}

/**
 * Convert severity to Sentry level
 */
function severityToSentryLevel(
  severity: SecurityEvent["severity"]
): "fatal" | "error" | "warning" | "info" {
  switch (severity) {
    case "critical":
      return "fatal";
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "info";
  }
}

/**
 * Mask sensitive identifier (email, phone, etc.)
 */
function maskIdentifier(identifier: string): string {
  if (identifier.includes("@")) {
    // Email: show first 2 chars and domain
    const [local, domain] = identifier.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  }
  // Generic: show first 3 and last 2 chars
  if (identifier.length > 5) {
    return `${identifier.slice(0, 3)}...${identifier.slice(-2)}`;
  }
  return "***";
}

/**
 * Initialize Sentry (call in instrumentation.ts or layout)
 */
export function initMonitoring(): void {
  if (!process.env.SENTRY_DSN) {
    console.log("Sentry not configured - skipping monitoring initialization");
    return;
  }

  // Sentry is initialized via @sentry/nextjs config files
  // This function serves as a hook for additional setup
  console.log("Security monitoring initialized");
}

/**
 * Health check for monitoring system
 */
export async function checkMonitoringHealth(): Promise<{
  healthy: boolean;
  sentry: boolean;
  webhook: boolean;
}> {
  const sentry = !!process.env.SENTRY_DSN;
  const webhook = !!process.env.SECURITY_WEBHOOK_URL;
  
  return {
    healthy: sentry || webhook,
    sentry,
    webhook,
  };
}
