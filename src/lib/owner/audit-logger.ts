/**
 * Owner Audit Logger
 * 
 * Logs all sensitive owner actions for compliance and security monitoring.
 * Required for HIPAA, SOC 2, and security best practices.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type AuditAction =
  // Authentication
  | 'OWNER_LOGIN'
  | 'OWNER_LOGOUT'
  | 'OWNER_LOGIN_FAILED'
  | 'OWNER_SESSION_EXPIRED'
  // User management
  | 'VIEW_USER'
  | 'VIEW_USERS_LIST'
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'WARN_USER'
  | 'DELETE_USER'
  | 'EXPORT_USER_DATA'
  | 'VIEW_USER_NOTES'
  | 'ADD_USER_NOTE'
  // Content moderation
  | 'MODERATE_POST'
  | 'DELETE_POST'
  | 'MODERATE_COMMENT'
  | 'DELETE_COMMENT'
  // Data access
  | 'VIEW_PHI_DATA'
  | 'EXPORT_PHI_DATA'
  | 'VIEW_THERAPY_NOTES'
  | 'VIEW_EMERGENCY_CARDS'
  // System operations
  | 'VIEW_DASHBOARD'
  | 'VIEW_ANALYTICS'
  | 'RUN_AI_AGENT'
  | 'TRIGGER_BACKUP'
  | 'MODIFY_SETTINGS'
  | 'SEND_ANNOUNCEMENT'
  // Data governance
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_AUDIT_LOGS'
  | 'VIEW_DATA_QUALITY'
  | 'VIEW_GOVERNANCE_REPORT';

interface AuditLogOptions {
  userId: string;
  action: AuditAction;
  resource?: string; // e.g., "user:123", "post:456"
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

/**
 * Log an owner action to the audit trail
 */
export async function logOwnerAction(options: AuditLogOptions): Promise<void> {
  try {
    await prisma.ownerAuditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        resource: options.resource,
        details: options.details as Prisma.InputJsonValue,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        success: options.success ?? true,
      },
    });
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error('[audit-logger] Failed to log owner action:', error);
  }
}

/**
 * Get audit logs for a specific user (owner)
 */
export async function getOwnerAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }
) {
  return prisma.ownerAuditLog.findMany({
    where: {
      userId,
      ...(options?.action && { action: options.action }),
      ...(options?.startDate && {
        createdAt: {
          gte: options.startDate,
          ...(options?.endDate && { lte: options.endDate }),
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get all audit logs (for security review)
 */
export async function getAllOwnerAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
}) {
  return prisma.ownerAuditLog.findMany({
    where: {
      ...(options?.action && { action: options.action }),
      ...(options?.startDate && {
        createdAt: {
          gte: options.startDate,
          ...(options?.endDate && { lte: options.endDate }),
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get failed login attempts (security monitoring)
 */
export async function getFailedLoginAttempts(options?: {
  limit?: number;
  hours?: number;
}) {
  const since = new Date();
  since.setHours(since.getHours() - (options?.hours ?? 24));

  return prisma.ownerAuditLog.findMany({
    where: {
      action: 'OWNER_LOGIN_FAILED',
      success: false,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
  });
}

/**
 * Check if there are suspicious activities (brute force detection)
 */
export async function detectSuspiciousActivity(ipAddress: string): Promise<{
  isSuspicious: boolean;
  failedAttempts: number;
}> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const failedAttempts = await prisma.ownerAuditLog.count({
    where: {
      action: 'OWNER_LOGIN_FAILED',
      ipAddress,
      success: false,
      createdAt: { gte: oneHourAgo },
    },
  });

  return {
    isSuspicious: failedAttempts >= 5, // 5 failed attempts in 1 hour
    failedAttempts,
  };
}
