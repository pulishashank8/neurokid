/**
 * API performance logging - Pillar 19
 */
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function logApiPerformance(params: {
  method: string;
  routePath: string;
  statusCode: number;
  responseTime: number;
  userId?: string | null;
}): Promise<void> {
  try {
    await prisma.apiPerformanceLog.create({
      data: {
        method: params.method,
        routePath: params.routePath,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        userId: params.userId ?? null,
      },
    });
  } catch (err) {
    console.error('[API Perf] Failed to log:', err);
  }
}

export async function getApiPerformanceMetrics(daysBack = 1): Promise<{
  slowest: { routePath: string; p95: number; avgTime: number; totalReqs: number }[];
  byRoute: { routePath: string; p50: number; p95: number; p99: number; errorRate: number; totalReqs: number }[];
}> {
  const since = subDays(new Date(), daysBack);

  const logs = await prisma.apiPerformanceLog.findMany({
    where: { createdAt: { gte: since } },
    select: { routePath: true, statusCode: true, responseTime: true },
  });

  const byRoute = new Map<
    string,
    { times: number[]; errors: number; total: number }
  >();

  for (const log of logs) {
    const key = log.routePath;
    const existing = byRoute.get(key) ?? { times: [], errors: 0, total: 0 };
    existing.times.push(log.responseTime);
    existing.total++;
    if (log.statusCode >= 400) existing.errors++;
    byRoute.set(key, existing);
  }

  const byRouteArray = Array.from(byRoute.entries()).map(([routePath, data]) => {
    const sorted = [...data.times].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
    const avgTime = data.times.length > 0
      ? data.times.reduce((a, b) => a + b, 0) / data.times.length
      : 0;
    const errorRate = data.total > 0 ? (data.errors / data.total) * 100 : 0;
    return { routePath, p50, p95, p99, avgTime, errorRate, totalReqs: data.total };
  });

  const slowest = byRouteArray
    .filter((r) => r.totalReqs >= 5)
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 15)
    .map((r) => ({ routePath: r.routePath, p95: r.p95, avgTime: r.avgTime, totalReqs: r.totalReqs }));

  return { slowest, byRoute: byRouteArray };
}

export interface PerformanceDataPoint {
  time: string;
  responseTime: number;
  activeUsers: number;
  requests: number;
}

export async function getSystemPerformanceTimeSeries(
  period: '24h' | '7d' | '30d'
): Promise<PerformanceDataPoint[]> {
  const now = new Date();
  const points = period === '24h' ? 24 : period === '7d' ? 7 : 30;
  const since = period === '24h'
    ? subDays(now, 1)
    : period === '7d'
      ? subDays(now, 7)
      : subDays(now, 30);

  // Build time buckets
  const buckets: { start: Date; end: Date; label: string }[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const start = new Date(now);
    const end = new Date(now);
    if (period === '24h') {
      start.setHours(start.getHours() - i);
      end.setHours(end.getHours() - i + 1);
      start.setMinutes(0, 0, 0);
      end.setMinutes(0, 0, 0);
      buckets.push({
        start,
        end,
        label: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      start.setDate(start.getDate() - i);
      end.setDate(end.getDate() - i + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      });
    }
  }

  // Fetch API performance logs (response time + request count per bucket)
  const logs = await prisma.apiPerformanceLog.findMany({
    where: { createdAt: { gte: since } },
    select: { responseTime: true, createdAt: true },
  });

  // Active users: UserSession (heartbeats from logged-in users) + AnalyticsEvent (page_view, login)
  const [sessions, events] = await Promise.all([
    prisma.userSession.findMany({
      where: { lastActiveAt: { gte: since } },
      select: { userId: true, lastActiveAt: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        userId: { not: null },
        eventType: { in: ['page_view', 'login', 'signup'] },
      },
      select: { userId: true, createdAt: true },
    }),
  ]);

  const result: PerformanceDataPoint[] = buckets.map((bucket) => {
    const bucketLogs = logs.filter(
      (l) => l.createdAt >= bucket.start && l.createdAt < bucket.end
    );
    const bucketUserIds = new Set<string>();
    sessions
      .filter(
        (s) => s.lastActiveAt >= bucket.start && s.lastActiveAt < bucket.end
      )
      .forEach((s) => bucketUserIds.add(s.userId));
    events
      .filter(
        (e) => e.createdAt >= bucket.start && e.createdAt < bucket.end
      )
      .forEach((e) => bucketUserIds.add(e.userId!));

    const avgResponse =
      bucketLogs.length > 0
        ? Math.round(
            bucketLogs.reduce((s, l) => s + l.responseTime, 0) /
              bucketLogs.length
          )
        : 0;

    return {
      time: bucket.label,
      responseTime: avgResponse,
      activeUsers: bucketUserIds.size,
      requests: bucketLogs.length,
    };
  });

  return result;
}
