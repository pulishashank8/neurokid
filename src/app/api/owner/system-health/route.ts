import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subMinutes, subHours } from 'date-fns';
import { DB_LATENCY_CRITICAL_MS, DB_LATENCY_WARN_MS, RATE_LIMIT_WARN, AI_FAILURES_WARN } from '@/lib/owner/thresholds';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const fiveMinAgo = subMinutes(now, 5);
    const oneHourAgo = subHours(now, 1);

    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Math.round(performance.now() - dbStart);

    const [recentMetrics, rateLimitCount, messageRateLimitCount, aiFailures] = await Promise.all([
      prisma.systemMetric.findMany({
        where: { recordedAt: { gte: oneHourAgo } },
        orderBy: { recordedAt: 'desc' },
        take: 100,
      }),
      prisma.rateLimitLog.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.messageRateLimit.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.aIJob.count({
        where: { status: 'failed', completedAt: { gte: fiveMinAgo } },
      }),
    ]);

    const metricsMap = recentMetrics.reduce(
      (acc, m) => {
        if (!acc[m.metricName]) acc[m.metricName] = [];
        acc[m.metricName].push({ value: m.metricValue, at: m.recordedAt });
        return acc;
      },
      {} as Record<string, { value: number; at: Date }[]>
    );

    const latestDbLatency =
      metricsMap.db_latency_ms?.[0]?.value ?? dbLatencyMs;
    const rateLimitTriggers =
      metricsMap.rate_limit_triggers_5m?.[0]?.value ?? rateLimitCount + messageRateLimitCount;

    const status =
      latestDbLatency >= DB_LATENCY_CRITICAL_MS || aiFailures > AI_FAILURES_WARN
        ? 'critical'
        : latestDbLatency >= DB_LATENCY_WARN_MS || rateLimitTriggers >= RATE_LIMIT_WARN
          ? 'warning'
          : 'healthy';

    // DB latency trend (last 24h from SystemMetric for charting)
    const dbLatencyHistory = (metricsMap.db_latency_ms ?? [])
      .slice(0, 48)
      .map((m) => ({ at: m.at, value: m.value }))
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    return NextResponse.json({
      status,
      uptimeSeconds: process.uptime?.() ?? 0,
      dbLatencyMs: latestDbLatency,
      rateLimitTriggers,
      aiFailuresLast5m: aiFailures,
      apiErrorRate: 0,
      p95ResponseTime: null,
      dbLatencyHistory,
    });
  } catch (error) {
    console.error('[System Health] Error:', error);
    return NextResponse.json({
      status: 'critical',
      error: String(error),
    });
  }
}
