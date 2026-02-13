/**
 * AI Weekly Summary - generates insight string from aggregated metrics
 */
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function generateAIWeeklySummary(): Promise<string> {
  const last7d = subDays(new Date(), 7);
  const prev7d = subDays(last7d, 7);

  const [
    usageCount7d,
    jobCount7d,
    failedUsage7d,
    failedJob7d,
    usageCountPrev,
    jobCountPrev,
    failedUsagePrev,
    failedJobPrev,
    successLogs,
    byFeature,
  ] = await Promise.all([
    prisma.aIUsageLog.count({ where: { createdAt: { gte: last7d } } }),
    prisma.aIJob.count({ where: { createdAt: { gte: last7d } } }),
    prisma.aIUsageLog.count({ where: { status: 'failed', createdAt: { gte: last7d } } }),
    prisma.aIJob.count({ where: { status: 'failed', createdAt: { gte: last7d } } }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.aIJob.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.aIUsageLog.count({ where: { status: 'failed', createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.aIJob.count({ where: { status: 'failed', createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.aIUsageLog.findMany({
      where: { status: 'success', createdAt: { gte: last7d } },
      select: { responseTimeMs: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: last7d } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const totalRequests = usageCount7d || jobCount7d;
  const failedCount = failedUsage7d + failedJob7d;
  const prevTotal = usageCountPrev || jobCountPrev;
  const prevFailed = failedUsagePrev + failedJobPrev;

  const change = prevTotal > 0 ? ((totalRequests - prevTotal) / prevTotal) * 100 : 0;
  const failureRate = totalRequests > 0 ? (failedCount / totalRequests) * 100 : 0;
  const prevFailureRate = prevTotal > 0 ? (prevFailed / prevTotal) * 100 : 0;
  const responseTimes = successLogs.map((l) => l.responseTimeMs ?? 0).filter(Boolean);
  const p95 = responseTimes.length > 0
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
    : 0;
  const topFeature = byFeature[0]?.feature ?? 'ai_chat';

  const parts: string[] = [];
  if (change > 10) parts.push(`AI requests up ${change.toFixed(0)}% vs last week.`);
  else if (change < -10) parts.push(`AI requests down ${Math.abs(change).toFixed(0)}% vs last week.`);
  else parts.push('AI request volume stable.');

  if (failureRate > 5) parts.push(`Failure rate elevated at ${failureRate.toFixed(1)}%.`);
  else if (failureRate < prevFailureRate - 2) parts.push('Failure rate improved.');
  else parts.push('Failure rate within normal range.');

  if (p95 > 5000) parts.push(`Slow responses: p95 at ${(p95 / 1000).toFixed(1)}s.`);
  else parts.push('Response times acceptable.');

  parts.push(`Most used: ${topFeature}.`);

  return parts.join(' ');
}
