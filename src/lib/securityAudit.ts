import { prisma } from './prisma';
import { logger } from './logger';

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFICATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'IDOR_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'PERMISSION_DENIED'
  | 'ADMIN_ACTION'
  | 'MODERATION_ACTION'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DELETED'
  | 'SUSPICIOUS_ACTIVITY';

interface SecurityAuditOptions {
  userId?: string | null;
  ip?: string;
  userAgent?: string;
  action: SecurityEventType;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export async function logSecurityEvent(options: SecurityAuditOptions): Promise<void> {
  const { userId, ip, userAgent, action, resource, resourceId, details, severity = 'medium' } = options;

  const logData = {
    action,
    userId: userId || 'anonymous',
    ip: ip || 'unknown',
    userAgent: userAgent?.substring(0, 200),
    resource,
    resourceId,
    details,
    severity,
    timestamp: new Date().toISOString(),
  };

  logger.info(logData, `Security Event: ${action}`);

  try {
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          targetType: resource || 'security',
          targetId: resourceId,
          ipAddress: ip,
          userAgent: userAgent?.substring(0, 500),
          changes: details ? JSON.parse(JSON.stringify(details)) : undefined,
        },
      });
    }
  } catch (error) {
    logger.warn({ error, action }, 'Failed to write security audit to database');
  }
}

export async function logLoginAttempt(
  success: boolean,
  email: string,
  ip: string,
  userAgent?: string,
  userId?: string,
  reason?: string
): Promise<void> {
  await logSecurityEvent({
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
    userId,
    ip,
    userAgent,
    resource: 'auth',
    details: {
      email: email.substring(0, 3) + '***',
      success,
      reason,
    },
    severity: success ? 'low' : 'medium',
  });
}

export async function logRateLimitExceeded(
  limiterName: string,
  identifier: string,
  ip: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    action: 'RATE_LIMIT_EXCEEDED',
    ip,
    userAgent,
    resource: 'rate_limit',
    details: {
      limiter: limiterName,
      identifier: identifier.length > 10 ? identifier.substring(0, 4) + '***' : identifier,
    },
    severity: 'medium',
  });
}

export async function logIdorAttempt(
  userId: string,
  targetResourceId: string,
  resourceType: string,
  ip: string
): Promise<void> {
  await logSecurityEvent({
    action: 'IDOR_ATTEMPT',
    userId,
    ip,
    resource: resourceType,
    resourceId: targetResourceId,
    severity: 'high',
  });
}

export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    action: 'ADMIN_ACTION',
    userId: adminUserId,
    resource: 'admin',
    resourceId: targetUserId,
    details: {
      adminAction: action,
      ...details,
    },
    severity: 'high',
  });
}

export async function logModerationAction(
  moderatorId: string,
  action: string,
  targetId: string,
  targetType: string,
  reason?: string
): Promise<void> {
  await logSecurityEvent({
    action: 'MODERATION_ACTION',
    userId: moderatorId,
    resource: targetType,
    resourceId: targetId,
    details: {
      moderationAction: action,
      reason,
    },
    severity: 'medium',
  });
}

export async function getSecurityEvents(
  filters: {
    userId?: string;
    action?: SecurityEventType;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit = 100
): Promise<unknown[]> {
  const where: Record<string, unknown> = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }
  }

  try {
    const events = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { username: true },
            },
          },
        },
      },
    });

    return events;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch security events');
    return [];
  }
}
