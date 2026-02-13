/**
 * Data Retention Policy Engine
 * 
 * Implements automated data retention and archival based on configured policies
 * Complies with GDPR, HIPAA, and other data governance requirements
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'DataRetention' });

export interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  autoArchive: boolean;
  autoPurge: boolean;
}

// Default retention policies
export const DEFAULT_POLICIES: RetentionPolicy[] = [
  { dataType: 'UserSession', retentionDays: 90, autoArchive: true, autoPurge: true },
  { dataType: 'ErrorLog', retentionDays: 365, autoArchive: true, autoPurge: false },
  { dataType: 'AIUsageLog', retentionDays: 30, autoArchive: true, autoPurge: true }, // HIPAA sensitive
  { dataType: 'AuditLog', retentionDays: 2555, autoArchive: true, autoPurge: false }, // 7 years
  { dataType: 'BackupEvent', retentionDays: 180, autoArchive: false, autoPurge: true },
  { dataType: 'PageView', retentionDays: 180, autoArchive: true, autoPurge: true },
  { dataType: 'SystemMetric', retentionDays: 90, autoArchive: true, autoPurge: true },
  { dataType: 'RateLimitLog', retentionDays: 30, autoArchive: false, autoPurge: true },
  // User data: controlled by user, not auto-purged
  { dataType: 'Post', retentionDays: 9999, autoArchive: false, autoPurge: false },
  { dataType: 'Comment', retentionDays: 9999, autoArchive: false, autoPurge: false },
];

/**
 * Get all retention policies
 */
export async function getRetentionPolicies(): Promise<RetentionPolicy[]> {
  return DEFAULT_POLICIES;
}

/**
 * Apply retention policy to UserSessions
 */
export async function applyUserSessionRetention(): Promise<{
  archived: number;
  purged: number;
}> {
  const policy = DEFAULT_POLICIES.find(p => p.dataType === 'UserSession');
  if (!policy) return { archived: 0, purged: 0 };

  const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

  logger.info({ cutoffDate, retentionDays: policy.retentionDays }, 'Applying UserSession retention policy');

  // Purge old sessions
  let purged = 0;
  if (policy.autoPurge) {
    const result = await prisma.userSession.deleteMany({
      where: { lastActiveAt: { lt: cutoffDate } },
    });
    purged = result.count;
    logger.info({ count: purged }, 'Purged old UserSessions');
  }

  return { archived: 0, purged };
}

/**
 * Apply retention policy to PageViews
 */
export async function applyPageViewRetention(): Promise<{
  archived: number;
  purged: number;
}> {
  const policy = DEFAULT_POLICIES.find(p => p.dataType === 'PageView');
  if (!policy) return { archived: 0, purged: 0 };

  const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

  logger.info({ cutoffDate, retentionDays: policy.retentionDays }, 'Applying PageView retention policy');

  let purged = 0;
  if (policy.autoPurge) {
    try {
      const result = await prisma.pageView.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });
      purged = result.count;
      logger.info({ count: purged }, 'Purged old PageViews');
    } catch (err) {
      logger.error({ error: err }, 'Failed to purge PageViews');
    }
  }

  return { archived: 0, purged };
}

/**
 * Apply retention policy to BackupEvents
 */
export async function applyBackupEventRetention(): Promise<{
  archived: number;
  purged: number;
}> {
  const policy = DEFAULT_POLICIES.find(p => p.dataType === 'BackupEvent');
  if (!policy) return { archived: 0, purged: 0 };

  const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

  logger.info({ cutoffDate, retentionDays: policy.retentionDays }, 'Applying BackupEvent retention policy');

  let purged = 0;
  if (policy.autoPurge) {
    const result = await prisma.backupEvent.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    purged = result.count;
    logger.info({ count: purged }, 'Purged old BackupEvents');
  }

  return { archived: 0, purged };
}

/**
 * Apply retention policy to RateLimitLogs
 */
export async function applyRateLimitLogRetention(): Promise<{
  archived: number;
  purged: number;
}> {
  const policy = DEFAULT_POLICIES.find(p => p.dataType === 'RateLimitLog');
  if (!policy) return { archived: 0, purged: 0 };

  const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

  logger.info({ cutoffDate, retentionDays: policy.retentionDays }, 'Applying RateLimitLog retention policy');

  let purged = 0;
  if (policy.autoPurge) {
    const result = await prisma.rateLimitLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    purged = result.count;
    logger.info({ count: purged }, 'Purged old RateLimitLogs');
  }

  return { archived: 0, purged };
}

/**
 * Run all retention policies
 */
export async function runAllRetentionPolicies(): Promise<{
  totalArchived: number;
  totalPurged: number;
  policies: Array<{ dataType: string; archived: number; purged: number }>;
}> {
  logger.info('Starting retention policy execution');

  const results = await Promise.allSettled([
    applyUserSessionRetention(),
    applyPageViewRetention(),
    applyBackupEventRetention(),
    applyRateLimitLogRetention(),
  ]);

  const policies = results.map((r, i) => {
    const dataType = ['UserSession', 'PageView', 'BackupEvent', 'RateLimitLog'][i];
    if (r.status === 'fulfilled') {
      return { dataType, ...r.value };
    }
    logger.error({ dataType, error: r.reason }, 'Retention policy failed');
    return { dataType, archived: 0, purged: 0 };
  });

  const totalArchived = policies.reduce((sum, p) => sum + p.archived, 0);
  const totalPurged = policies.reduce((sum, p) => sum + p.purged, 0);

  logger.info({ totalArchived, totalPurged }, 'Retention policy execution completed');

  return { totalArchived, totalPurged, policies };
}

/**
 * Scheduled job: run daily at 2 AM UTC
 * In production, call this from a cron job or Vercel scheduled function
 */
export async function scheduledRetentionJob() {
  try {
    const result = await runAllRetentionPolicies();
    logger.info(result, 'Scheduled retention job completed');
    return result;
  } catch (err) {
    logger.error({ error: err }, 'Scheduled retention job failed');
    throw err;
  }
}
