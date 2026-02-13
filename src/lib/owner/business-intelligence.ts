/**
 * Business Intelligence calculations - Pillar 11
 *
 * Computes and stores: CAC, LTV, DAU, WAU, MAU, Stickiness, Retention,
 * Churn Rate, Feature Adoption, NPS, AI Cost per User.
 *
 * Run via cron: GET /api/cron/business-intelligence
 */
import { prisma } from '@/lib/prisma';
import {
  subDays,
  subMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
} from 'date-fns';

const PERIOD_DAILY = 'daily';
const PERIOD_WEEKLY = 'weekly';
const PERIOD_MONTHLY = 'monthly';

/** Rough cost per 1K tokens (Groq approximate) for AI cost estimation */
const COST_PER_1K_TOKENS = 0.001;

async function upsertMetric(
  metricName: string,
  metricValue: number,
  period: string,
  periodDate: Date
): Promise<void> {
  const dateOnly = startOfDay(periodDate);
  await prisma.businessMetric.upsert({
    where: {
      metricName_period_periodDate: { metricName, period, periodDate: dateOnly },
    },
    create: { metricName, metricValue, period, periodDate: dateOnly },
    update: { metricValue },
  });
}

export async function runBusinessIntelligenceCalculation(): Promise<{
  success: boolean;
  metricsComputed: number;
  error?: string;
}> {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = subDays(today, 1);
  const last7d = subDays(today, 7);
  const last30d = subDays(today, 30);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const thisMonthStart = startOfMonth(now);

  let metricsComputed = 0;

  try {
    // --- DAU, WAU, MAU ---
    const [dau, wau, mau, totalUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count({
        where: {
          isBanned: false,
          OR: [
            { lastLoginAt: { gte: subDays(now, 1) } },
            { lastActiveAt: { gte: subDays(now, 1) } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          isBanned: false,
          OR: [
            { lastLoginAt: { gte: last7d } },
            { lastActiveAt: { gte: last7d } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          isBanned: false,
          OR: [
            { lastLoginAt: { gte: last30d } },
            { lastActiveAt: { gte: last30d } },
          ],
        },
      }),
      prisma.user.count({ where: { isBanned: false } }),
      prisma.user.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
    ]);

    await upsertMetric('DAU', dau, PERIOD_DAILY, today);
    await upsertMetric('WAU', wau, PERIOD_WEEKLY, startOfWeek(today, { weekStartsOn: 1 }));
    await upsertMetric('MAU', mau, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 3;

    // --- Stickiness (DAU:MAU) ---
    const stickiness = mau > 0 ? dau / mau : 0;
    await upsertMetric('STICKINESS', stickiness, PERIOD_DAILY, today);
    metricsComputed += 1;

    // --- Retention Rate (from recent cohorts) ---
    const twelveWeeksAgo = subDays(now, 12 * 7);
    const retentionSnapshots = await prisma.userRetentionSnapshot.findMany({
      where: { cohortDate: { gte: twelveWeeksAgo } },
      orderBy: { cohortDate: 'desc' },
      take: 6,
    });
    let retentionRate = 0;
    if (retentionSnapshots.length > 0) {
      const avgDay7 =
        retentionSnapshots.reduce((s, r) => s + r.day7Retention, 0) /
        retentionSnapshots.length;
      const avgDay30 =
        retentionSnapshots.reduce((s, r) => s + r.day30Retention, 0) /
        retentionSnapshots.length;
      retentionRate = (avgDay7 + avgDay30) / 2;
    }
    await upsertMetric('RETENTION_RATE', retentionRate, PERIOD_WEEKLY, today);
    metricsComputed += 1;

    // --- Churn Rate (high+medium risk / total) ---
    const sevenDaysAgo = subDays(now, 7);
    const churnAtRisk = await prisma.churnPrediction.count({
      where: {
        predictedAt: { gte: sevenDaysAgo },
        riskLevel: { in: ['high', 'medium'] },
      },
    });
    const churnRate = totalUsers > 0 ? churnAtRisk / totalUsers : 0;
    await upsertMetric('CHURN_RATE', churnRate, PERIOD_WEEKLY, today);
    metricsComputed += 1;

    // --- CAC (Cost per Acquisition) ---
    const marketingCosts = await prisma.platformCost.aggregate({
      where: {
        month: { gte: thisMonthStart },
        category: { in: ['MARKETING', 'ACQUISITION', 'ADS'] },
      },
      _sum: { amount: true },
    });
    const totalMarketing = marketingCosts._sum.amount ?? 0;
    const cac = newUsersThisMonth > 0 ? totalMarketing / newUsersThisMonth : 0;
    await upsertMetric('CAC', cac, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 1;

    // --- LTV (Lifetime Value) - estimate from engagement ---
    // Simplified: avg posts + screening completions per user as proxy for value
    const [postCount, screeningCount] = await Promise.all([
      prisma.post.count(),
      prisma.screeningResult.count({ where: { completedAt: { not: null } } }),
    ]);
    const engagementPerUser =
      totalUsers > 0 ? (postCount + screeningCount) / totalUsers : 0;
    // Placeholder LTV: $0 when no revenue; use engagement as proxy for future monetization
    const ltv = engagementPerUser * 0.5; // Arbitrary multiplier for demo
    await upsertMetric('LTV', ltv, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 1;

    // --- LTV:CAC Ratio ---
    const ltvCacRatio = cac > 0 ? ltv / cac : ltv > 0 ? 999 : 0;
    await upsertMetric('LTV_CAC_RATIO', ltvCacRatio, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 1;

    // --- Feature Adoption (AI chat, screening) ---
    const [aiChatUsers, screeningUsers] = await Promise.all([
      prisma.aIUsageLog
        .groupBy({ by: ['userId'], where: { userId: { not: null } } })
        .then((r) => r.length),
      prisma.screeningResult
        .groupBy({ by: ['userId'], where: { completedAt: { not: null } } })
        .then((r) => r.length),
    ]);
    const aiAdoption = totalUsers > 0 ? aiChatUsers / totalUsers : 0;
    const screeningAdoption = totalUsers > 0 ? screeningUsers / totalUsers : 0;
    await upsertMetric('FEATURE_ADOPTION_AI_CHAT', aiAdoption, PERIOD_MONTHLY, thisMonthStart);
    await upsertMetric('FEATURE_ADOPTION_SCREENING', screeningAdoption, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 2;

    // --- NPS (from UserFeedback) ---
    const npsFeedback = await prisma.userFeedback.findMany({
      where: { type: 'NPS', rating: { not: null } },
      select: { rating: true },
    });
    let nps = 0;
    if (npsFeedback.length > 0) {
      const ratings = npsFeedback.map((f) => f.rating ?? 0).filter((r) => r >= 0 && r <= 10);
      const promoters = ratings.filter((r) => r >= 9).length;
      const detractors = ratings.filter((r) => r <= 6).length;
      const total = ratings.length;
      nps = total > 0 ? ((promoters - detractors) / total) * 100 : 0;
    }
    await upsertMetric('NPS', nps, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 1;

    // --- AI Cost (from PlatformCost + token estimate) ---
    const aiCosts = await prisma.platformCost.aggregate({
      where: { month: { gte: lastMonthStart }, category: 'AI' },
      _sum: { amount: true },
    });
    const aiCostFromPlatform = aiCosts._sum.amount ?? 0;

    const tokenUsage = await prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: last30d } },
      _sum: { tokensUsed: true },
    });
    const totalTokens = tokenUsage._sum.tokensUsed ?? 0;
    const estimatedAiCost = (totalTokens / 1000) * COST_PER_1K_TOKENS;
    const totalAiCost = aiCostFromPlatform + estimatedAiCost;

    const aiCostPerUser = mau > 0 ? totalAiCost / mau : 0;
    await upsertMetric('AI_COST_PER_USER', aiCostPerUser, PERIOD_MONTHLY, thisMonthStart);
    await upsertMetric('AI_COST_TOTAL', totalAiCost, PERIOD_MONTHLY, thisMonthStart);
    metricsComputed += 2;

    return { success: true, metricsComputed };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[BusinessIntelligence] Computation failed:', error);
    return { success: false, metricsComputed, error: msg };
  }
}

/**
 * Get BI metrics for dashboard (last 90 days)
 */
export async function getBusinessMetrics(options?: {
  period?: 'daily' | 'weekly' | 'monthly';
  metricNames?: string[];
  daysBack?: number;
}) {
  const { period = PERIOD_MONTHLY, metricNames, daysBack = 90 } = options ?? {};
  const since = subDays(new Date(), daysBack);

  const where: { metricName?: object; period: string; periodDate: object } = {
    period,
    periodDate: { gte: since },
  };
  if (metricNames && metricNames.length > 0) {
    where.metricName = { in: metricNames };
  }

  const metrics = await prisma.businessMetric.findMany({
    where,
    orderBy: { periodDate: 'desc' },
    take: 365,
  });

  return metrics;
}
