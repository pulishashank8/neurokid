/**
 * HIPAA-Compliant Audit Logging
 * 
 * All access to PHI must be logged for compliance.
 * This includes: who accessed, what resource, when, and action type.
 */

import { prisma } from "@/lib/prisma";

export type AuditAction =
  // Therapy Session Actions
  | "THERAPY_SESSION_CREATED"
  | "THERAPY_SESSION_ACCESSED"
  | "THERAPY_SESSION_UPDATED"
  | "THERAPY_SESSION_DELETED"
  // Emergency Card Actions
  | "EMERGENCY_CARD_CREATED"
  | "EMERGENCY_CARD_ACCESSED"
  | "EMERGENCY_CARD_UPDATED"
  | "EMERGENCY_CARD_DELETED"
  // Daily Win Actions
  | "DAILY_WIN_CREATED"
  | "DAILY_WIN_ACCESSED"
  | "DAILY_WIN_UPDATED"
  | "DAILY_WIN_DELETED"
  // AI Chat Actions
  | "AI_CHAT_REQUESTED"
  | "AI_CHAT_COMPLETED"
  // Authentication Actions
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "UNAUTHORIZED_ACCESS_ATTEMPT"
  // Admin Actions
  | "ADMIN_USER_BANNED"
  | "ADMIN_CONTENT_MODERATED"
  | "ADMIN_PHI_ACCESSED";

export interface AuditLogEntry {
  action: AuditAction;
  userId: string;
  resourceType?: "TherapySession" | "EmergencyCard" | "DailyWin" | "AIConversation" | "User" | "Post" | "Comment";
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface CreateAuditLogInput {
  action: AuditAction;
  userId: string;
  resourceType?: AuditLogEntry["resourceType"];
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

class AuditLogger {
  private static readonly PHI_ACTIONS: AuditAction[] = [
    "THERAPY_SESSION_CREATED",
    "THERAPY_SESSION_ACCESSED",
    "THERAPY_SESSION_UPDATED",
    "THERAPY_SESSION_DELETED",
    "EMERGENCY_CARD_CREATED",
    "EMERGENCY_CARD_ACCESSED",
    "EMERGENCY_CARD_UPDATED",
    "EMERGENCY_CARD_DELETED",
    "ADMIN_PHI_ACCESSED",
  ];

  /**
   * Log an audit event
   * Fails silently to not break user flows, but logs error
   */
  static async log(input: CreateAuditLogInput): Promise<void> {
    try {
      // Never log actual PHI in metadata - only identifiers
      const sanitizedMetadata = this.sanitizeMetadata(input.metadata);

      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          targetType: input.resourceType || null,
          targetId: input.resourceId || null,
          changes: sanitizedMetadata as unknown as undefined,
          ipAddress: null, // Set by middleware if available
          userAgent: null, // Set by middleware if available
        },
      });

      // For PHI access, also log to separate high-security log
      if (this.isPhiAction(input.action)) {
        console.info(`[PHI_ACCESS] ${input.action} by ${input.userId} on ${input.resourceType}:${input.resourceId}`);
      }
    } catch (error) {
      // Never throw - audit failure shouldn't break user action
      // But alert administrators
      console.error("CRITICAL: Audit log failed:", error);
      console.error("Audit entry that failed:", {
        action: input.action,
        userId: input.userId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });
    }
  }

  /**
   * Log with request context (IP, user agent)
   */
  static async logWithContext(
    input: CreateAuditLogInput,
    request: Request
  ): Promise<void> {
    const headers = request.headers;
    
    await this.log({
      ...input,
      metadata: {
        ...input.metadata,
        ipAddress: this.getClientIp(headers),
        userAgent: headers.get("user-agent") || undefined,
      },
    });
  }

  /**
   * Query audit log for a specific resource
   * Use this for compliance reporting
   */
  static async queryAccessLog(
    resourceType: string,
    resourceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      actions?: AuditAction[];
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        targetType: resourceType,
        targetId: resourceId,
        createdAt: {
          gte: options?.startDate,
          lte: options?.endDate,
        },
        action: options?.actions
          ? { in: options.actions }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
    });

    return logs.map((log) => ({
      action: log.action as AuditAction,
      userId: log.userId,
      resourceType: log.targetType as AuditLogEntry["resourceType"],
      resourceId: log.targetId || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      metadata: (log.changes as Record<string, unknown>) || undefined,
      timestamp: log.createdAt,
    }));
  }

  /**
   * Get user's own audit trail (GDPR/data portability)
   */
  static async getUserAuditTrail(
    userId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: options?.startDate,
          lte: options?.endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 500,
    });

    return logs.map((log) => ({
      action: log.action as AuditAction,
      userId: log.userId,
      resourceType: log.targetType as AuditLogEntry["resourceType"],
      resourceId: log.targetId || undefined,
      metadata: (log.changes as Record<string, unknown>) || undefined,
      timestamp: log.createdAt,
    }));
  }

  private static isPhiAction(action: AuditAction): boolean {
    return this.PHI_ACTIONS.includes(action);
  }

  private static sanitizeMetadata(
    metadata: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    // Remove any potential PHI from metadata
    const sensitiveKeys = ["content", "notes", "text", "message", "data"];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private static getClientIp(headers: Headers): string | undefined {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return headers.get("x-real-ip") || undefined;
  }
}

export { AuditLogger };
