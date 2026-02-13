/**
 * Owner Dashboard KPIs - shared logic for API and server components
 */
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, format } from 'date-fns';

export async function getKpis() {
  const now = new Date();
  const today = startOfDay(now);
  const last7d = subDays(today, 7);
  const last30d = subDays(today, 30);
  const prev7d = subDays(last7d, 7);
  const prev30d = subDays(last30d, 30);

  const [
    totalUsers,
    newSignupsToday,
    activeUsers7d,
    activeUsers30d,
    activeUsersPrev7d,
    activeUsersPrev30d,
    totalPosts,
    postsPrev7d,
    totalMessagesSent,
    totalMessagesPrev7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: last30d } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: prev7d, lt: last7d } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: prev30d, lt: last30d } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.message.count({ where: { createdAt: { gte: last7d } } }),
    prisma.message.count({ where: { createdAt: { gte: subDays(prev7d, 7), lt: prev7d } } }),
  ]);

  const dauMauRatio = activeUsers30d > 0 ? (activeUsers7d / activeUsers30d) * (7 / 30) : 0;
  const change = (current: number, prev: number) =>
    prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;

  const [
    postsThis7d,
    aiUsageLogLast,
    aiJobLast,
    aiUsageLogPrev,
    aiJobPrev,
    screeningLast7d,
    screeningPrev7d,
  ] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: last7d } } }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: last7d } } }),
    prisma.aIJob.count({ where: { createdAt: { gte: last7d } } }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.aIJob.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
    prisma.screeningResult.count({ where: { completedAt: { gte: last7d } } }),
    prisma.screeningResult.count({ where: { completedAt: { gte: subDays(prev7d, 7), lt: prev7d } } }),
  ]);
  const aiUsageLast7d = aiUsageLogLast + aiJobLast;
  const aiUsagePrev7d = aiUsageLogPrev + aiJobPrev;

  const sparkData: { date: string; users: number; active: number; ai?: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const dayStart = startOfDay(d);
    const dayEnd = subDays(startOfDay(subDays(d, -1)), 0);
    const [u, a, aiLogs, aiJobs] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.aIJob.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    ]);
    sparkData.push({ date: format(dayStart, 'yyyy-MM-dd'), users: u, active: a, ai: aiLogs + aiJobs });
  }

  const aiUsageChange = change(aiUsageLast7d + 1, aiUsagePrev7d + 1);
  const screeningChangePct = change(screeningLast7d, screeningPrev7d);

  const { generateKpiInsight } = await import('./ai-insights');
  const aiInsights: Record<string, string> = {};
  aiInsights.totalUsers = generateKpiInsight({
    key: 'totalUsers',
    value: totalUsers,
    screeningCompletions: screeningLast7d,
    screeningChange: screeningChangePct,
    postCreateCount: postsThis7d,
  });
  aiInsights.activeUsers7d = generateKpiInsight({
    key: 'activeUsers7d',
    value: activeUsers7d,
    change: change(activeUsers7d, activeUsersPrev7d),
  });
  aiInsights.newSignupsToday = generateKpiInsight({
    key: 'newSignupsToday',
    value: newSignupsToday,
  });
  aiInsights.totalPosts = generateKpiInsight({
    key: 'totalPosts',
    value: postsThis7d,
    change: change(postsThis7d, postsPrev7d),
  });
  aiInsights.totalMessagesSent = generateKpiInsight({
    key: 'totalMessagesSent',
    value: totalMessagesSent,
    change: change(totalMessagesSent, totalMessagesPrev7d),
  });
  aiInsights.aiUsage = generateKpiInsight({
    key: 'aiUsage',
    value: aiUsageLast7d,
    change: aiUsageChange,
  });
  aiInsights.dauMauRatio = generateKpiInsight({
    key: 'dauMauRatio',
    value: dauMauRatio,
  });

  function simpleForecast(values: number[], days = 7): number[] {
    if (values.length < 2) return Array(days).fill(values[0] ?? 0);
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n;
    return Array.from({ length: days }, (_, i) => Math.max(0, Math.round(intercept + slope * (n + i))));
  }

  const activeForecast = simpleForecast(sparkData.map((d) => d.active));
  const usersForecast = simpleForecast(sparkData.map((d) => d.users));
  const aiForecast = simpleForecast(sparkData.map((d) => d.ai ?? 0));

  // Fetch donut chart metrics
  const [
    parentsCount,
    providersCount,
    unverifiedCount,
    commentsCount,
    votesCount,
    bannedCount,
  ] = await Promise.all([
    prisma.user.count({ where: { userRoles: { some: { role: 'PARENT' } } } }),
    prisma.user.count({ where: { claimedProviders: { some: {} } } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.comment.count(),
    prisma.vote.count(),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
  ]);

  const cleanUsers = Math.max(0, totalUsers - bannedCount);
  const churnedCount = Math.max(0, totalUsers - activeUsers7d - activeUsers30d - bannedCount);

  return {
    totalUsers,
    activeUsers7d,
    activeUsers30d,
    newSignupsToday,
    dauMauRatio: Math.round(dauMauRatio * 100) / 100,
    totalPosts,
    totalMessagesSent,
    aiUsage7d: aiUsageLast7d,
    changes: {
      activeUsers7d: change(activeUsers7d, activeUsersPrev7d),
      activeUsers30d: change(activeUsers30d, activeUsersPrev30d),
      totalPosts: change(postsThis7d, postsPrev7d),
      totalMessages: change(totalMessagesSent, totalMessagesPrev7d),
      aiUsage: aiUsageChange,
    },
    aiInsights,
    forecast: {
      activeUsers7d: activeForecast,
      newSignups: usersForecast,
      aiUsage: aiForecast,
    },
    sparkData,
    // Donut chart metrics
    donutMetrics: {
      userDistribution: {
        parents: parentsCount,
        providers: providersCount,
        unverified: unverifiedCount,
      },
      contentBreakdown: {
        posts: totalPosts,
        comments: commentsCount,
        votes: votesCount,
      },
      engagementStatus: {
        activeWeekly: activeUsers7d,
        activeMonthly: activeUsers30d - activeUsers7d,
        churned: churnedCount,
      },
      moderationStatus: {
        clean: cleanUsers,
        flagged: 0,
        banned: bannedCount,
      },
    },
  };
}
