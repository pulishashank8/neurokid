/**
 * Analytics & Business Tools
 *
 * Tools for KPIs, AI usage, costs, and engagement metrics.
 * Used by Business Analyst, Growth Strategist, and other agents.
 */

import { prisma } from '@/lib/prisma';
import { subDays, subHours, startOfDay, format } from 'date-fns';
import { createTool } from '../core/tool-registry';
import type { Tool, ToolExecutionResult } from '../core/types';

// ============================================================
// GET KPI SUMMARY
// ============================================================

interface KPISummaryInput {
  timeframeDays?: number;
}

interface KPISummaryOutput {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newSignupsToday: number;
  totalPosts: number;
  totalMessages: number;
  totalScreenings: number;
  aiRequestsThisWeek: number;
  dauMauRatio: number;
  changes: {
    activeUsers7d: number;
    totalPosts: number;
    aiRequests: number;
  };
}

export const getKPISummaryTool: Tool<KPISummaryInput, KPISummaryOutput> = createTool(
  {
    name: 'get_kpi_summary',
    description: 'Get comprehensive KPI summary including user metrics, engagement, and week-over-week changes.',
    category: 'analytics',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Timeframe for analysis (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'KPI summary with metrics and changes',
    },
  },
  async (input): Promise<ToolExecutionResult<KPISummaryOutput>> => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const last7d = subDays(today, 7);
      const last30d = subDays(today, 30);
      const prev7d = subDays(last7d, 7);

      const [
        totalUsers,
        activeUsers7d,
        activeUsers30d,
        newSignupsToday,
        totalPosts,
        postsThisWeek,
        postsPrevWeek,
        totalMessages,
        totalScreenings,
        aiRequestsThisWeek,
        aiRequestsPrevWeek,
        activeUsersPrev7d,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: last30d } } }),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.post.count(),
        prisma.post.count({ where: { createdAt: { gte: last7d } } }),
        prisma.post.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
        prisma.message.count({ where: { createdAt: { gte: last7d } } }),
        prisma.screeningResult.count({ where: { completedAt: { gte: last30d } } }),
        prisma.aIUsageLog.count({ where: { createdAt: { gte: last7d } } }),
        prisma.aIUsageLog.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: prev7d, lt: last7d } } }),
      ]);

      const dauMauRatio = activeUsers30d > 0 ? (activeUsers7d / activeUsers30d) * (7 / 30) : 0;

      const change = (current: number, prev: number) =>
        prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers7d,
          activeUsers30d,
          newSignupsToday,
          totalPosts,
          totalMessages,
          totalScreenings,
          aiRequestsThisWeek,
          dauMauRatio: Math.round(dauMauRatio * 100) / 100,
          changes: {
            activeUsers7d: change(activeUsers7d, activeUsersPrev7d),
            totalPosts: change(postsThisWeek, postsPrevWeek),
            aiRequests: change(aiRequestsThisWeek, aiRequestsPrevWeek),
          },
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get KPI summary',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET AI USAGE METRICS
// ============================================================

interface AIUsageMetricsInput {
  timeframeDays?: number;
}

interface AIUsageMetricsOutput {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  failureRate: number;
  averageResponseTimeMs: number;
  p95ResponseTimeMs: number;
  requestsByFeature: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
  estimatedCost: number;
}

export const getAIUsageMetricsTool: Tool<AIUsageMetricsInput, AIUsageMetricsOutput> = createTool(
  {
    name: 'get_ai_usage_metrics',
    description: 'Get AI usage metrics including request counts, failure rates, response times, and estimated costs.',
    category: 'analytics',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Days to analyze (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'AI usage metrics and cost estimates',
    },
  },
  async (input): Promise<ToolExecutionResult<AIUsageMetricsOutput>> => {
    try {
      const days = input.timeframeDays ?? 7;
      const since = subDays(new Date(), days);
      const today = startOfDay(new Date());

      const [
        totalRequests,
        successfulRequests,
        failedRequests,
        successLogs,
        byFeature,
      ] = await Promise.all([
        prisma.aIUsageLog.count({ where: { createdAt: { gte: since } } }),
        prisma.aIUsageLog.count({ where: { status: 'success', createdAt: { gte: since } } }),
        prisma.aIUsageLog.count({ where: { status: 'failed', createdAt: { gte: since } } }),
        prisma.aIUsageLog.findMany({
          where: { status: 'success', createdAt: { gte: since } },
          select: { responseTimeMs: true },
        }),
        prisma.aIUsageLog.groupBy({
          by: ['feature'],
          where: { createdAt: { gte: since } },
          _count: { id: true },
        }),
      ]);

      // Calculate response times
      const responseTimes = successLogs
        .map(l => l.responseTimeMs ?? 0)
        .filter(Boolean)
        .sort((a, b) => a - b);

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p95ResponseTime = responseTimes[p95Index] ?? 0;

      // Requests by feature
      const requestsByFeature: Record<string, number> = {};
      for (const f of byFeature) {
        requestsByFeature[f.feature] = f._count.id;
      }

      // Requests by day
      const requestsByDay: Array<{ date: string; count: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = subDays(today, i);
        const dayEnd = subDays(today, i - 1);
        const count = await prisma.aIUsageLog.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        });
        requestsByDay.push({
          date: format(dayStart, 'yyyy-MM-dd'),
          count,
        });
      }

      // Estimate cost (rough: $0.001 per request average for Groq)
      const estimatedCost = totalRequests * 0.001;

      return {
        success: true,
        data: {
          totalRequests,
          successfulRequests,
          failedRequests,
          failureRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
          averageResponseTimeMs: Math.round(avgResponseTime),
          p95ResponseTimeMs: p95ResponseTime,
          requestsByFeature,
          requestsByDay,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI usage metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET ENGAGEMENT METRICS
// ============================================================

interface EngagementMetricsInput {
  timeframeDays?: number;
}

interface EngagementMetricsOutput {
  postsPerActiveUser: number;
  commentsPerPost: number;
  messagesPerUser: number;
  screeningsPerUser: number;
  aiRequestsPerUser: number;
  engagementScore: number;
  topEngagedFeatures: Array<{ feature: string; usage: number }>;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export const getEngagementMetricsTool: Tool<EngagementMetricsInput, EngagementMetricsOutput> = createTool(
  {
    name: 'get_engagement_metrics',
    description: 'Analyze user engagement including posts, comments, messages, and feature usage per user.',
    category: 'analytics',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Days to analyze (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'Engagement metrics and trends',
    },
  },
  async (input): Promise<ToolExecutionResult<EngagementMetricsOutput>> => {
    try {
      const days = input.timeframeDays ?? 7;
      const since = subDays(new Date(), days);
      const prevSince = subDays(since, days);

      const [
        activeUsers,
        posts,
        comments,
        messages,
        screenings,
        aiRequests,
        prevPosts,
        prevComments,
      ] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
        prisma.post.count({ where: { createdAt: { gte: since } } }),
        prisma.comment.count({ where: { createdAt: { gte: since } } }),
        prisma.message.count({ where: { createdAt: { gte: since } } }),
        prisma.screeningResult.count({ where: { completedAt: { gte: since } } }),
        prisma.aIUsageLog.count({ where: { createdAt: { gte: since } } }),
        prisma.post.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
        prisma.comment.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      ]);

      const safeDiv = (a: number, b: number) => b > 0 ? a / b : 0;

      const postsPerActiveUser = safeDiv(posts, activeUsers);
      const commentsPerPost = safeDiv(comments, posts);
      const messagesPerUser = safeDiv(messages, activeUsers);
      const screeningsPerUser = safeDiv(screenings, activeUsers);
      const aiRequestsPerUser = safeDiv(aiRequests, activeUsers);

      // Engagement score (0-100)
      const engagementScore = Math.min(100,
        (postsPerActiveUser * 20) +
        (commentsPerPost * 15) +
        (messagesPerUser * 0.5) +
        (screeningsPerUser * 10) +
        (aiRequestsPerUser * 2)
      );

      // Trend calculation
      const currentEngagement = posts + comments;
      const prevEngagement = prevPosts + prevComments;
      let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (prevEngagement > 0) {
        const change = ((currentEngagement - prevEngagement) / prevEngagement) * 100;
        if (change > 10) engagementTrend = 'increasing';
        else if (change < -10) engagementTrend = 'decreasing';
      }

      return {
        success: true,
        data: {
          postsPerActiveUser: Math.round(postsPerActiveUser * 100) / 100,
          commentsPerPost: Math.round(commentsPerPost * 100) / 100,
          messagesPerUser: Math.round(messagesPerUser * 100) / 100,
          screeningsPerUser: Math.round(screeningsPerUser * 100) / 100,
          aiRequestsPerUser: Math.round(aiRequestsPerUser * 100) / 100,
          engagementScore: Math.round(engagementScore),
          topEngagedFeatures: [
            { feature: 'Community Posts', usage: posts },
            { feature: 'Comments', usage: comments },
            { feature: 'Messaging', usage: messages },
            { feature: 'AI Chat', usage: aiRequests },
            { feature: 'Screening', usage: screenings },
          ].sort((a, b) => b.usage - a.usage),
          engagementTrend,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get engagement metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET LIFECYCLE METRICS
// ============================================================

interface LifecycleMetricsInput {
  timeframeDays?: number;
}

interface LifecycleMetricsOutput {
  newUsers: number;
  activatingUsers: number;
  engagedUsers: number;
  atRiskUsers: number;
  churnedUsers: number;
  reactivatedUsers: number;
  activationRate: number;
  churnRate: number;
}

export const getLifecycleMetricsTool: Tool<LifecycleMetricsInput, LifecycleMetricsOutput> = createTool(
  {
    name: 'get_lifecycle_metrics',
    description: 'Analyze user lifecycle stages: new, activating, engaged, at-risk, churned, and reactivated.',
    category: 'analytics',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Days to analyze (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'User lifecycle stage breakdown',
    },
  },
  async (input): Promise<ToolExecutionResult<LifecycleMetricsOutput>> => {
    try {
      const now = new Date();
      const last7d = subDays(now, 7);
      const last14d = subDays(now, 14);
      const last30d = subDays(now, 30);
      const last60d = subDays(now, 60);

      const [
        newUsers,
        activeRecent,
        activeInPast,
        inactiveLong,
        reactivated,
        highChurnRisk,
      ] = await Promise.all([
        // New: registered in last 7 days
        prisma.user.count({ where: { createdAt: { gte: last7d } } }),
        // Active in last 7 days
        prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
        // Active 7-30 days ago but not in last 7 days
        prisma.user.count({
          where: {
            lastLoginAt: { gte: last30d, lt: last7d },
          },
        }),
        // Not active in 30+ days
        prisma.user.count({
          where: {
            lastLoginAt: { lt: last30d },
            bannedAt: null,
          },
        }),
        // Reactivated: inactive for 30+ days but active in last 7
        prisma.user.count({
          where: {
            createdAt: { lt: last30d },
            lastLoginAt: { gte: last7d },
          },
        }),
        prisma.churnPrediction.count({ where: { riskLevel: 'high' } }),
      ]);

      // Estimate lifecycle stages
      const activatingUsers = Math.round(newUsers * 0.7); // Estimate 70% of new users are activating
      const engagedUsers = activeRecent - newUsers;
      const atRiskUsers = highChurnRisk;
      const churnedUsers = inactiveLong;

      const activationRate = newUsers > 0 ? (activatingUsers / newUsers) * 100 : 0;
      const totalUsers = await prisma.user.count();
      const churnRate = totalUsers > 0 ? (churnedUsers / totalUsers) * 100 : 0;

      return {
        success: true,
        data: {
          newUsers,
          activatingUsers,
          engagedUsers: Math.max(0, engagedUsers),
          atRiskUsers,
          churnedUsers,
          reactivatedUsers: reactivated,
          activationRate: Math.round(activationRate),
          churnRate: Math.round(churnRate * 10) / 10,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lifecycle metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// EXPORT ALL ANALYTICS TOOLS
// ============================================================

export const analyticsTools = [
  getKPISummaryTool,
  getAIUsageMetricsTool,
  getEngagementMetricsTool,
  getLifecycleMetricsTool,
];
