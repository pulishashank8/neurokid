/**
 * System Metrics Collector
 *
 * Collects DevOps-style metrics for Owner Dashboard monitoring:
 * - DB query latency
 * - Rate limit triggers (last 5 min)
 * - Uptime
 *
 * Run via GET /api/cron/system-metrics (protected by CRON_SECRET)
 * or call collect() directly from instrumentation.
 */

import { prisma } from '@/lib/prisma';
import { subMinutes } from 'date-fns';
import { createAdminNotification } from '@/lib/owner/create-admin-notification';
import { DB_LATENCY_CRITICAL_MS, DB_LATENCY_WARN_MS, RATE_LIMIT_WARN, AI_FAILURES_WARN } from '@/lib/owner/thresholds';

export async function collectSystemMetrics(): Promise<void> {
  const now = new Date();
  const fiveMinAgo = subMinutes(now, 5);

  try {
    // 1. DB latency
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Math.round(performance.now() - dbStart);

    // 2. Rate limit triggers in last 5 min
    const rateLimitCount = await prisma.rateLimitLog.count({
      where: { createdAt: { gte: fiveMinAgo } },
    });

    const messageRateLimitCount = await prisma.messageRateLimit.count({
      where: { createdAt: { gte: fiveMinAgo } },
    });

    const totalRateLimits = rateLimitCount + messageRateLimitCount;

    // 3. Uptime (seconds)
    const uptimeSeconds = process.uptime?.() ?? 0;

    // 4. Failed AI jobs in last 5 min
    const failedAIJobs = await prisma.aIJob.count({
      where: {
        status: 'failed',
        completedAt: { gte: fiveMinAgo },
      },
    });

    // 5. Report count (last 5 min) for spike detection
    const reportCount = await prisma.report.count({
      where: { createdAt: { gte: fiveMinAgo } },
    });

    // Create AdminNotification when thresholds breached
    if (dbLatencyMs >= DB_LATENCY_CRITICAL_MS) {
      await createAdminNotification({
        type: 'db_performance',
        severity: 'critical',
        message: `DB latency critical: ${dbLatencyMs}ms`,
        metadata: { dbLatencyMs },
      });
    } else if (dbLatencyMs >= DB_LATENCY_WARN_MS) {
      await createAdminNotification({
        type: 'db_performance',
        severity: 'warning',
        message: `DB latency elevated: ${dbLatencyMs}ms`,
        metadata: { dbLatencyMs },
      });
    }
    if (totalRateLimits >= RATE_LIMIT_WARN) {
      await createAdminNotification({
        type: 'rate_limit_spike',
        severity: 'warning',
        message: `High rate limit triggers: ${totalRateLimits} in last 5 min`,
        metadata: { count: totalRateLimits },
      });
    }
    if (failedAIJobs > AI_FAILURES_WARN) {
      await createAdminNotification({
        type: 'ai_failures',
        severity: 'critical',
        message: `${failedAIJobs} AI job failures in last 5 min`,
        metadata: { count: failedAIJobs },
      });
    }
    if (reportCount > 20) {
      await createAdminNotification({
        type: 'report_spike',
        severity: 'warning',
        message: `Unusual report spike: ${reportCount} reports in last 5 min`,
        metadata: { count: reportCount },
      });
    }

    await prisma.systemMetric.createMany({
      data: [
        { metricName: 'db_latency_ms', metricValue: dbLatencyMs, recordedAt: now },
        { metricName: 'rate_limit_triggers_5m', metricValue: totalRateLimits, recordedAt: now },
        { metricName: 'uptime_seconds', metricValue: uptimeSeconds, recordedAt: now },
        { metricName: 'ai_failures_5m', metricValue: failedAIJobs, recordedAt: now },
      ],
    });
  } catch (error) {
    console.error('[SystemMetrics] Collection failed:', error);
    await prisma.systemMetric.create({
      data: {
        metricName: 'collector_error',
        metricValue: 1,
        recordedAt: now,
      },
    });
    await createAdminNotification({
      type: 'collector_error',
      severity: 'critical',
      message: `System metrics collector failed: ${error instanceof Error ? error.message : String(error)}`,
      metadata: { error: String(error) },
    });
  }
}
