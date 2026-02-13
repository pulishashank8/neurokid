/**
 * Growth Strategist Agent
 * Analyzes forecasts, retention, and feature adoption
 */

import { prisma } from '@/lib/prisma';
import { subDays, subMonths } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runGrowthStrategistAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);
    const oneMonthAgo = subMonths(now, 1);

    // Fetch growth metrics
    const [
      totalUsers,
      newUsersWeek,
      newUsersPrevWeek,
      activeUsers7d,
      activeUsers30d,
      usersRegisteredLastMonth,
      usersStillActive,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.user.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          lastLoginAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // Calculate metrics
    const weeklyGrowthRate = newUsersPrevWeek > 0
      ? ((newUsersWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100
      : newUsersWeek > 0 ? 100 : 0;

    const stickiness = activeUsers30d > 0 ? (activeUsers7d / activeUsers30d) * 100 : 0;

    const retentionRate = usersRegisteredLastMonth > 0
      ? (usersStillActive / usersRegisteredLastMonth) * 100
      : 0;

    // Feature adoption (check AI usage and screening)
    const [aiUsers, screeningCompleted] = await Promise.all([
      prisma.aIUsageLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }).then(r => r.length),
      prisma.screeningResult.count({ where: { completedAt: { gte: thirtyDaysAgo } } }),
    ]);

    const aiAdoptionRate = activeUsers30d > 0 ? (aiUsers / activeUsers30d) * 100 : 0;

    // Growth forecast (simple linear projection)
    const dailyGrowthRate = newUsersWeek / 7;
    const projectedUsersIn30Days = Math.round(totalUsers + (dailyGrowthRate * 30));
    const projectedUsersIn90Days = Math.round(totalUsers + (dailyGrowthRate * 90));

    // Generate growth insights

    // Growth rate insight
    if (weeklyGrowthRate > 20) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'GROWTH',
        severity: 'info',
        title: 'Strong user growth',
        description: `User signups are up ${weeklyGrowthRate.toFixed(0)}% week-over-week (${newUsersWeek} new users).`,
        recommendation: 'Capitalize on momentum with referral incentives or content campaigns.',
        metrics: { weeklyGrowthRate, newUsersWeek },
        confidence: 0.9,
      });
    } else if (weeklyGrowthRate < -10 && newUsersPrevWeek > 5) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'RISK',
        severity: 'warning',
        title: 'Growth slowdown',
        description: `User signups are down ${Math.abs(weeklyGrowthRate).toFixed(0)}% week-over-week.`,
        recommendation: 'Review acquisition channels and consider new marketing initiatives.',
        metrics: { weeklyGrowthRate, newUsersWeek },
        confidence: 0.85,
      });
    }

    // Retention insight
    if (retentionRate < 30 && usersRegisteredLastMonth > 10) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'RISK',
        severity: 'warning',
        title: 'Retention needs improvement',
        description: `Only ${retentionRate.toFixed(0)}% of users from 30-60 days ago are still active.`,
        recommendation: 'Focus on onboarding experience and re-engagement campaigns.',
        metrics: { retentionRate, usersRegisteredLastMonth },
        confidence: 0.88,
      });
    } else if (retentionRate > 50) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'GROWTH',
        severity: 'info',
        title: 'Strong retention',
        description: `${retentionRate.toFixed(0)}% of users from 30-60 days ago are still active.`,
        metrics: { retentionRate },
        confidence: 0.9,
      });
    }

    // Stickiness insight
    if (stickiness < 20 && activeUsers30d > 20) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'RISK',
        severity: 'info',
        title: 'Low daily engagement',
        description: `Only ${stickiness.toFixed(0)}% DAU/MAU stickiness. Users may not be finding daily value.`,
        recommendation: 'Consider adding daily hooks like streaks, notifications, or fresh content.',
        metrics: { stickiness, activeUsers7d, activeUsers30d },
        confidence: 0.8,
      });
    }

    // Feature adoption
    if (aiAdoptionRate < 20 && activeUsers30d > 10) {
      insights.push({
        agentType: 'GROWTH_STRATEGIST',
        category: 'GROWTH',
        severity: 'info',
        title: 'AI feature underutilized',
        description: `Only ${aiAdoptionRate.toFixed(0)}% of active users have tried AI features.`,
        recommendation: 'Consider in-app prompts or onboarding to highlight AI capabilities.',
        metrics: { aiAdoptionRate, aiUsers },
        confidence: 0.75,
      });
    }

    // Growth forecast
    insights.push({
      agentType: 'GROWTH_STRATEGIST',
      category: 'GROWTH',
      severity: 'info',
      title: 'Growth forecast',
      description: `At current rate (${dailyGrowthRate.toFixed(1)}/day): ~${projectedUsersIn30Days.toLocaleString()} users in 30 days, ~${projectedUsersIn90Days.toLocaleString()} in 90 days.`,
      metrics: { totalUsers, dailyGrowthRate, projectedUsersIn30Days, projectedUsersIn90Days },
      confidence: 0.7,
    });

    return {
      agentType: 'GROWTH_STRATEGIST',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'GROWTH_STRATEGIST',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
