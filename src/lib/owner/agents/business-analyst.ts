/**
 * Business Analyst Agent
 * Monitors growth, costs, KPIs, and unit economics
 */

import { prisma } from '@/lib/prisma';
import { subDays, subHours, startOfDay } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runBusinessAnalystAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastHour = subHours(now, 1);

    // Fetch key metrics
    const [
      totalUsers,
      newUsersToday,
      newUsersYesterday,
      activeUsers7d,
      activeUsersPrev7d,
      aiUsageLastHour,
      aiUsagePrevHour,
      totalPosts,
      postsThisWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: lastWeek } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: subDays(lastWeek, 7), lt: lastWeek } } }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: lastHour } } }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: subHours(lastHour, 1), lt: lastHour } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: lastWeek } } }),
    ]);

    // Calculate growth rates
    const signupGrowth = newUsersYesterday > 0
      ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100
      : newUsersToday > 0 ? 100 : 0;

    const activeGrowth = activeUsersPrev7d > 0
      ? ((activeUsers7d - activeUsersPrev7d) / activeUsersPrev7d) * 100
      : activeUsers7d > 0 ? 100 : 0;

    const aiUsageGrowth = aiUsagePrevHour > 0
      ? ((aiUsageLastHour - aiUsagePrevHour) / aiUsagePrevHour) * 100
      : 0;

    // Generate insights based on metrics

    // Signup growth insight
    if (signupGrowth > 50) {
      insights.push({
        agentType: 'BUSINESS_ANALYST',
        category: 'GROWTH',
        severity: 'info',
        title: 'Signup surge detected',
        description: `New signups are up ${signupGrowth.toFixed(0)}% compared to yesterday. ${newUsersToday} users signed up today.`,
        recommendation: 'Consider sending a welcome campaign to maximize engagement.',
        metrics: { newUsersToday, signupGrowth },
        confidence: 0.9,
      });
    } else if (signupGrowth < -30 && newUsersYesterday > 3) {
      insights.push({
        agentType: 'BUSINESS_ANALYST',
        category: 'GROWTH',
        severity: 'warning',
        title: 'Signup decline detected',
        description: `New signups are down ${Math.abs(signupGrowth).toFixed(0)}% compared to yesterday.`,
        recommendation: 'Review marketing channels and landing page performance.',
        metrics: { newUsersToday, signupGrowth },
        confidence: 0.85,
      });
    }

    // Active user growth insight
    if (activeGrowth < -20 && activeUsersPrev7d > 10) {
      insights.push({
        agentType: 'BUSINESS_ANALYST',
        category: 'RISK',
        severity: 'warning',
        title: 'Active user decline',
        description: `Active users are down ${Math.abs(activeGrowth).toFixed(0)}% week-over-week.`,
        recommendation: 'Consider re-engagement campaigns for inactive users.',
        metrics: { activeUsers7d, activeGrowth },
        confidence: 0.88,
      });
    }

    // AI cost monitoring
    if (aiUsageGrowth > 100 && aiUsageLastHour > 50) {
      insights.push({
        agentType: 'BUSINESS_ANALYST',
        category: 'COST',
        severity: 'warning',
        title: 'AI usage spike detected',
        description: `AI requests are up ${aiUsageGrowth.toFixed(0)}% in the last hour (${aiUsageLastHour} requests).`,
        recommendation: 'Consider implementing response caching for common queries.',
        metrics: { aiUsageLastHour, aiUsageGrowth },
        confidence: 0.92,
      });
    }

    // Content engagement
    const postsPerActiveUser = activeUsers7d > 0 ? postsThisWeek / activeUsers7d : 0;
    if (postsPerActiveUser < 0.1 && activeUsers7d > 10) {
      insights.push({
        agentType: 'BUSINESS_ANALYST',
        category: 'GROWTH',
        severity: 'info',
        title: 'Low content creation rate',
        description: `Only ${postsPerActiveUser.toFixed(2)} posts per active user this week.`,
        recommendation: 'Consider prompts or incentives to encourage content creation.',
        metrics: { postsThisWeek, postsPerActiveUser },
        confidence: 0.8,
      });
    }

    // Milestone detection
    const milestones = [100, 500, 1000, 5000, 10000];
    for (const milestone of milestones) {
      if (totalUsers >= milestone && totalUsers - newUsersToday < milestone) {
        insights.push({
          agentType: 'BUSINESS_ANALYST',
          category: 'GROWTH',
          severity: 'info',
          title: `Milestone reached: ${milestone.toLocaleString()} users!`,
          description: `Congratulations! NeuroKid has reached ${milestone.toLocaleString()} total users.`,
          metrics: { totalUsers, milestone },
          confidence: 1.0,
        });
      }
    }

    return {
      agentType: 'BUSINESS_ANALYST',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'BUSINESS_ANALYST',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
