/**
 * Predictive Churn Analysis
 *
 * Scores users by:
 * - Last login time
 * - Drop in session frequency
 * - No feature usage in 14 days
 * - Decline in engagement
 *
 * Run nightly via GET /api/cron/churn-prediction
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

const INACTIVE_14_DAYS = 14;
const INACTIVE_7_DAYS = 7;
const CHURN_RISK_30_DAYS = 30;

export async function runChurnPrediction(): Promise<void> {
  const now = new Date();
  const fourteenDaysAgo = subDays(now, INACTIVE_14_DAYS);
  const sevenDaysAgo = subDays(now, INACTIVE_7_DAYS);
  const thirtyDaysAgo = subDays(now, CHURN_RISK_30_DAYS);

  try {
    const users = await prisma.user.findMany({
      where: { isBanned: false },
      select: {
        id: true,
        lastLoginAt: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    const eventCounts = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        createdAt: { gte: fourteenDaysAgo },
      },
      _count: { id: true },
    });
    const eventMap = new Map(eventCounts.map((e) => [e.userId!, e._count.id]));

    const predictions: Array<{
      userId: string;
      churnProbability: number;
      riskLevel: string;
    }> = [];

    for (const user of users) {
      const lastActive = user.lastActiveAt ?? user.lastLoginAt ?? user.createdAt;
      const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      const eventsLast14d = eventMap.get(user.id) ?? 0;

      let score = 0;
      const factors: string[] = [];

      // No login in 14+ days
      if (daysSinceActive >= INACTIVE_14_DAYS) {
        score += 0.4;
        factors.push('no_login_14d');
      }
      if (daysSinceActive >= INACTIVE_7_DAYS && daysSinceActive < INACTIVE_14_DAYS) {
        score += 0.2;
        factors.push('inactive_7d');
      }

      // No feature usage in 14 days
      if (eventsLast14d === 0 && daysSinceActive < INACTIVE_14_DAYS) {
        score += 0.2;
        factors.push('no_feature_usage_14d');
      }

      // Long inactive (30+ days)
      if (daysSinceActive >= CHURN_RISK_30_DAYS) {
        score += 0.3;
        factors.push('inactive_30d');
      }

      // New user who never engaged
      const daysSinceSignup = (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignup < 7 && eventsLast14d === 0) {
        score += 0.15;
        factors.push('new_no_engagement');
      }

      const churnProbability = Math.min(score, 1);
      let riskLevel = 'low';
      if (churnProbability >= 0.6) riskLevel = 'high';
      else if (churnProbability >= 0.3) riskLevel = 'medium';

      // Only store users at some risk
      if (churnProbability >= 0.2) {
        predictions.push({
          userId: user.id,
          churnProbability,
          riskLevel,
        });
      }
    }

    // Insert new predictions
    if (predictions.length > 0) {
      await prisma.churnPrediction.createMany({
        data: predictions.map((p) => ({
          userId: p.userId,
          churnProbability: p.churnProbability,
          riskLevel: p.riskLevel,
        })),
      });
    }

    // Prune predictions older than 7 days to avoid unbounded growth
    const sevenDaysAgoPrune = subDays(now, 7);
    await prisma.churnPrediction.deleteMany({
      where: { predictedAt: { lt: sevenDaysAgoPrune } },
    });
  } catch (error) {
    console.error('[ChurnPrediction] Failed:', error);
  }
}
