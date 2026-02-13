/**
 * Anomaly Detection System
 *
 * Detects:
 * - Sudden drop in active users
 * - Spike in error rates
 * - Spike in harmful content reports
 * - AI failure rate surge
 * - Unusual messaging spikes (spam risk)
 *
 * Run via GET /api/cron/anomaly-detection every 15 minutes.
 */

import { prisma } from '@/lib/prisma';
import { subMinutes, subHours } from 'date-fns';
import { createAdminNotification } from '@/lib/owner/create-admin-notification';

const THRESHOLD_ACTIVE_USERS_DROP = 0.3; // 30% drop
const THRESHOLD_REPORT_SPIKE = 3; // 3x increase
const THRESHOLD_AI_FAILURE_SPIKE = 5; // 5x baseline
const THRESHOLD_MESSAGING_SPIKE = 3; // 3x increase

export async function runAnomalyDetection(): Promise<void> {
  const now = new Date();
  const last24h = subHours(now, 24);
  const prev24h = subHours(last24h, 24);
  const fiveMinAgo = subMinutes(now, 5);
  const prevFiveMin = subMinutes(fiveMinAgo, 5);

  try {
    const [
      activeUsersLast24h,
      activeUsersPrev24h,
      reportCountLast5m,
      reportCountPrev5m,
      messageReportCountLast5m,
      messageReportCountPrev5m,
      aiFailuresLast5m,
      aiFailuresPrev5m,
      messageCountLast5m,
      messageCountPrev5m,
      recentMetrics,
    ] = await Promise.all([
      prisma.user.count({ where: { lastLoginAt: { gte: last24h } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: prev24h, lt: last24h } } }),
      prisma.report.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.report.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
      prisma.messageReport.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.messageReport.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
      prisma.aIJob.count({
        where: { status: 'failed', completedAt: { gte: fiveMinAgo } },
      }),
      prisma.aIJob.count({
        where: { status: 'failed', completedAt: { gte: prevFiveMin, lt: fiveMinAgo } },
      }),
      prisma.message.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
      prisma.systemMetric.findMany({
        where: { recordedAt: { gte: subMinutes(now, 15) } },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),
    ]);

    const anomalies: Array<{
      anomalyType: string;
      description: string;
      severity: string;
      metadata?: Record<string, unknown>;
    }> = [];

    // 1. Active users drop
    if (activeUsersPrev24h > 10 && activeUsersLast24h < activeUsersPrev24h * (1 - THRESHOLD_ACTIVE_USERS_DROP)) {
      const pct = Math.round(((activeUsersPrev24h - activeUsersLast24h) / activeUsersPrev24h) * 100);
      anomalies.push({
        anomalyType: 'active_users_drop',
        description: `Active users dropped ${pct}% vs previous 24h (${activeUsersLast24h} vs ${activeUsersPrev24h})`,
        severity: 'critical',
        metadata: { last24h: activeUsersLast24h, prev24h: activeUsersPrev24h, pct },
      });
    }

    // 2. Report spike (content + message reports)
    const totalReportsLast = reportCountLast5m + messageReportCountLast5m;
    const totalReportsPrev = reportCountPrev5m + messageReportCountPrev5m;
    if (totalReportsPrev > 0 && totalReportsLast >= totalReportsPrev * THRESHOLD_REPORT_SPIKE) {
      anomalies.push({
        anomalyType: 'report_spike',
        description: `Reports spiked to ${totalReportsLast} in 5 min (prev: ${totalReportsPrev})`,
        severity: totalReportsLast > 20 ? 'critical' : 'warning',
        metadata: { last5m: totalReportsLast, prev5m: totalReportsPrev },
      });
    } else if (totalReportsPrev === 0 && totalReportsLast > 15) {
      anomalies.push({
        anomalyType: 'report_spike',
        description: `Sudden surge: ${totalReportsLast} reports in 5 min`,
        severity: 'warning',
        metadata: { last5m: totalReportsLast },
      });
    }

    // 3. AI failure surge
    const aiBaseline = Math.max(aiFailuresPrev5m, 1);
    if (aiFailuresLast5m >= aiBaseline * THRESHOLD_AI_FAILURE_SPIKE) {
      anomalies.push({
        anomalyType: 'ai_failure_surge',
        description: `AI failures spiked: ${aiFailuresLast5m} in 5 min (prev: ${aiFailuresPrev5m})`,
        severity: aiFailuresLast5m > 10 ? 'critical' : 'warning',
        metadata: { last5m: aiFailuresLast5m, prev5m: aiFailuresPrev5m },
      });
    } else if (aiFailuresPrev5m === 0 && aiFailuresLast5m > 5) {
      anomalies.push({
        anomalyType: 'ai_failure_surge',
        description: `AI failures: ${aiFailuresLast5m} in 5 min`,
        severity: 'warning',
        metadata: { last5m: aiFailuresLast5m },
      });
    }

    // 4. Messaging spike (spam risk)
    const msgBaseline = Math.max(messageCountPrev5m, 1);
    if (messageCountLast5m >= msgBaseline * THRESHOLD_MESSAGING_SPIKE && messageCountLast5m > 30) {
      anomalies.push({
        anomalyType: 'messaging_spike',
        description: `Messaging spike: ${messageCountLast5m} messages in 5 min (prev: ${messageCountPrev5m}) - possible spam`,
        severity: messageCountLast5m > 100 ? 'critical' : 'warning',
        metadata: { last5m: messageCountLast5m, prev5m: messageCountPrev5m },
      });
    }

    // 5. Error rate from system metrics
    const dbLatencies = recentMetrics
      .filter((m) => m.metricName === 'db_latency_ms')
      .map((m) => m.metricValue);
    const avgDbLatency = dbLatencies.length > 0
      ? dbLatencies.reduce((a, b) => a + b, 0) / dbLatencies.length
      : 0;
    if (avgDbLatency > 2000) {
      anomalies.push({
        anomalyType: 'error_rate_spike',
        description: `DB latency elevated: avg ${Math.round(avgDbLatency)}ms over last 15 min`,
        severity: 'critical',
        metadata: { avgDbLatencyMs: avgDbLatency },
      });
    }

    for (const a of anomalies) {
      await prisma.systemAnomaly.create({
        data: {
          anomalyType: a.anomalyType,
          description: a.description,
          severity: a.severity,
          metadata: a.metadata ?? undefined,
        },
      });
      await createAdminNotification({
        type: 'anomaly',
        severity: a.severity as 'info' | 'warning' | 'critical',
        message: `[Anomaly] ${a.description}`,
        relatedEntity: a.anomalyType,
        metadata: a.metadata,
      });
    }
  } catch (error) {
    console.error('[AnomalyDetection] Failed:', error);
    await createAdminNotification({
      type: 'anomaly_detection_error',
      severity: 'critical',
      message: `Anomaly detection failed: ${error instanceof Error ? error.message : String(error)}`,
      metadata: { error: String(error) },
    });
  }
}
