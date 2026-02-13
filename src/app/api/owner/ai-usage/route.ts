import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays, subHours } from 'date-fns';

type TimeRange = '24h' | '7d' | '30d' | '365d';

function getSinceDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '24h':
      return subHours(now, 24);
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    case '365d':
      return subDays(now, 365);
    default:
      return subDays(now, 7);
  }
}

function getChartBuckets(range: TimeRange): { date: string; label: string }[] {
  const buckets: { date: string; label: string }[] = [];
  const now = new Date();

  if (range === '24h') {
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(d.getHours() - i);
      d.setMinutes(0, 0, 0);
      const dateStr = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      buckets.push({ date: dateStr, label: `${d.getHours().toString().padStart(2, '0')}:00` });
    }
  } else if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().slice(0, 10);
      buckets.push({ date: dateStr, label: dateStr.slice(5) });
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().slice(0, 10);
      buckets.push({ date: dateStr, label: dateStr.slice(5) });
    }
  } else {
    // 365d: 12 monthly buckets
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().slice(0, 7); // YYYY-MM
      buckets.push({ date: dateStr, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    }
  }
  return buckets;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') as TimeRange) || '7d';
  const validRange = ['24h', '7d', '30d', '365d'].includes(range) ? range : '7d';
  const since = getSinceDate(validRange);
  const chartBuckets = getChartBuckets(validRange);

  try {

    const [
      usageLogCount,
      successLogs,
      failedLogs,
      aiJobsTotal,
      aiJobsFailed,
      completedJobs,
      byFeature,
    ] = await Promise.all([
      prisma.aIUsageLog.count({ where: { createdAt: { gte: since } } }),
      prisma.aIUsageLog.findMany({
        where: { status: 'success', createdAt: { gte: since } },
        select: { responseTimeMs: true, tokensUsed: true },
      }),
      prisma.aIUsageLog.count({
        where: { status: 'failed', createdAt: { gte: since } },
      }),
      prisma.aIJob.count({ where: { createdAt: { gte: since } } }),
      prisma.aIJob.count({
        where: { status: 'failed', createdAt: { gte: since } },
      }),
      // Fallback: get completed AIJobs when AIUsageLog is sparse (for response time + features)
      prisma.aIJob.findMany({
        where: { status: 'completed', createdAt: { gte: since }, startedAt: { not: null }, completedAt: { not: null } },
        select: { id: true, userId: true, conversationId: true, startedAt: true, completedAt: true, createdAt: true },
        take: 2000,
      }),
      prisma.aIUsageLog.groupBy({
        by: ['feature'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const totalRequests = usageLogCount || aiJobsTotal;

    // Avg response time: prefer AIUsageLog, fallback to AIJob (completedAt - startedAt)
    let avgResponseTime = 0;
    if (successLogs.length > 0) {
      avgResponseTime =
        successLogs.reduce((s, l) => s + (l.responseTimeMs || 0), 0) / successLogs.length;
    } else if (completedJobs.length > 0) {
      const times = completedJobs
        .map((j) => (j.startedAt && j.completedAt ? j.completedAt.getTime() - j.startedAt.getTime() : 0))
        .filter(Boolean);
      avgResponseTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    let tokenEstimate = successLogs.reduce((s, l) => s + (l.tokensUsed || 0), 0);
    // When AIUsageLog has no token data but we have completed AIJobs, estimate (~450 tokens/request avg)
    const tokenEstimateFromFallback =
      tokenEstimate === 0 && completedJobs.length > 0;
    if (tokenEstimateFromFallback) {
      tokenEstimate = completedJobs.length * 450;
    }

    // Most used features: prefer AIUsageLog, fallback to derived from completed AIJobs (conversationId)
    let mostUsedFeatures = byFeature.map((f) => ({ feature: f.feature, count: f._count.id }));
    if (mostUsedFeatures.length === 0 && completedJobs.length > 0) {
      const featureCounts: Record<string, number> = {};
      for (const j of completedJobs) {
        const feature = j.conversationId.startsWith('ephemeral_') ? 'ai_chat' : 'storytelling';
        featureCounts[feature] = (featureCounts[feature] ?? 0) + 1;
      }
      mostUsedFeatures = Object.entries(featureCounts)
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count);
    }

    const responseTimes =
      successLogs.length > 0
        ? successLogs.map((l) => l.responseTimeMs ?? 0).filter(Boolean)
        : completedJobs
          .map((j) =>
            j.startedAt && j.completedAt ? j.completedAt.getTime() - j.startedAt.getTime() : 0
          )
          .filter(Boolean);
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const p95Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    const slowCount = responseTimes.filter((t) => t > 5000).length;
    const totalFailed = failedLogs + aiJobsFailed;

    const weeklySummary = await import('@/lib/owner/ai-summary').then((m) =>
      m.generateAIWeeklySummary()
    );

    // Chart data: bucket by hour/day/month based on range
    let allLogs = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, tokensUsed: true },
    });

    // Auto-backfill: when AIUsageLog is empty but we have completed jobs, create logs so next load has real data
    if (allLogs.length === 0 && completedJobs.length > 0) {
      const existingJobIds = new Set(
        (await prisma.aIUsageLog.findMany({
          where: { aiJobId: { not: null } },
          select: { aiJobId: true },
        }))
          .map((l) => l.aiJobId)
          .filter(Boolean) as string[]
      );
      for (const job of completedJobs) {
        if (existingJobIds.has(job.id)) continue;
        const feature = job.conversationId.startsWith('ephemeral_') ? 'ai_chat' : 'storytelling';
        const responseTimeMs =
          job.startedAt && job.completedAt
            ? job.completedAt.getTime() - job.startedAt.getTime()
            : null;
        try {
          await prisma.aIUsageLog.create({
            data: {
              aiJobId: job.id,
              userId: job.userId,
              feature,
              status: 'success',
              tokensUsed: null,
              responseTimeMs,
            },
          });
          existingJobIds.add(job.id);
        } catch {
          // Skip on duplicate or error
        }
      }
      // Re-fetch after backfill
      allLogs = await prisma.aIUsageLog.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, tokensUsed: true },
      });
    }

    const byDate: Record<string, { count: number; tokens: number; label: string }> = {};
    for (const b of chartBuckets) {
      byDate[b.date] = { count: 0, tokens: 0, label: b.label };
    }

    function getBucketKey(createdAt: Date): string {
      if (validRange === '24h') {
        const d = new Date(createdAt);
        d.setMinutes(0, 0, 0);
        return d.toISOString().slice(0, 13);
      }
      if (validRange === '365d') {
        return createdAt.toISOString().slice(0, 7);
      }
      return createdAt.toISOString().slice(0, 10);
    }

    if (allLogs.length > 0) {
      allLogs.forEach((l) => {
        const key = getBucketKey(l.createdAt);
        if (byDate[key]) {
          byDate[key].count++;
          byDate[key].tokens += l.tokensUsed ?? 0;
        }
      });
    } else {
      // Fallback: use AIJob when AIUsageLog is empty. Request counts are REAL (actual completed jobs).
      completedJobs.forEach((j) => {
        const key = getBucketKey(j.createdAt);
        if (byDate[key]) {
          byDate[key].count++;
          byDate[key].tokens += 450; // token count estimated; request count is real
        }
      });
    }
    const dailyUsage = chartBuckets.map((b) => ({
      date: b.date,
      label: b.label,
      count: byDate[b.date]?.count ?? 0,
      tokens: byDate[b.date]?.tokens ?? 0,
    }));

    return NextResponse.json({
      totalRequests,
      failedCalls: totalFailed,
      avgResponseTimeMs: Math.round(avgResponseTime),
      tokenEstimate,
      tokenEstimateFromFallback: tokenEstimateFromFallback ?? false,
      dailyUsageFromFallback: allLogs.length === 0 && completedJobs.length > 0,
      mostUsedFeatures,
      p95ResponseTimeMs: p95Ms,
      slowRequestCount: slowCount,
      weeklySummary,
      dailyUsage,
      range: validRange,
    });
  } catch (error) {
    console.error('[AI Usage] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI usage' }, { status: 500 });
  }
}
