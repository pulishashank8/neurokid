/**
 * User & Growth Related Tools
 *
 * Tools for querying user metrics, growth rates, retention, and cohort analysis.
 */

import { prisma } from '@/lib/prisma';
import { subDays, subHours, startOfDay, format } from 'date-fns';
import { createTool } from '../core/tool-registry';
import type { Tool, ToolExecutionResult } from '../core/types';

// ============================================================
// GET USER METRICS
// ============================================================

interface UserMetricsInput {
  timeframeDays?: number;
}

interface UserMetricsOutput {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  bannedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersByRole: Record<string, number>;
}

export const getUserMetricsTool: Tool<UserMetricsInput, UserMetricsOutput> = createTool(
  {
    name: 'get_user_metrics',
    description: 'Get comprehensive user metrics including total users, active users, new signups, and user distribution by role and status.',
    category: 'database',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Number of days to analyze (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'User metrics including counts, activity, and distribution',
    },
  },
  async (input): Promise<ToolExecutionResult<UserMetricsOutput>> => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const last7d = subDays(today, 7);
      const last30d = subDays(today, 30);

      const [
        totalUsers,
        activeUsers7d,
        activeUsers30d,
        newUsersToday,
        newUsersThisWeek,
        bannedUsers,
        verifiedUsers,
        unverifiedUsers,
        parents,
        providers,
        admins,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: last30d } } }),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: last7d } } }),
        prisma.user.count({ where: { bannedAt: { not: null } } }),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.user.count({ where: { emailVerified: false } }),
        prisma.user.count({ where: { userRoles: { some: { role: 'PARENT' } } } }),
        prisma.user.count({ where: { claimedProviders: { some: {} } } }),
        prisma.user.count({ where: { userRoles: { some: { role: 'ADMIN' } } } }),
      ]);

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers7d,
          activeUsers30d,
          newUsersToday,
          newUsersThisWeek,
          bannedUsers,
          verifiedUsers,
          unverifiedUsers,
          usersByRole: { parents, providers, admins },
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET GROWTH RATES
// ============================================================

interface GrowthRatesInput {
  compareWeeks?: number;
}

interface GrowthRatesOutput {
  weeklySignupGrowth: number;
  weeklyActiveGrowth: number;
  dailySignupRate: number;
  projectedUsers30d: number;
  projectedUsers90d: number;
  signupTrend: number[];
}

export const getGrowthRatesTool: Tool<GrowthRatesInput, GrowthRatesOutput> = createTool(
  {
    name: 'get_growth_rates',
    description: 'Calculate growth rates including week-over-week signup growth, active user growth, and projections.',
    category: 'analytics',
    parameters: [
      {
        name: 'compareWeeks',
        type: 'number',
        description: 'Number of weeks to compare (default: 2)',
        required: false,
        default: 2,
      },
    ],
    returns: {
      type: 'object',
      description: 'Growth rates and projections',
    },
  },
  async (input): Promise<ToolExecutionResult<GrowthRatesOutput>> => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const last7d = subDays(today, 7);
      const prev7d = subDays(last7d, 7);

      const [
        totalUsers,
        newUsersThisWeek,
        newUsersPrevWeek,
        activeUsers7d,
        activeUsersPrev7d,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: last7d } } }),
        prisma.user.count({ where: { createdAt: { gte: prev7d, lt: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: prev7d, lt: last7d } } }),
      ]);

      // Calculate growth rates
      const weeklySignupGrowth = newUsersPrevWeek > 0
        ? ((newUsersThisWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100
        : newUsersThisWeek > 0 ? 100 : 0;

      const weeklyActiveGrowth = activeUsersPrev7d > 0
        ? ((activeUsers7d - activeUsersPrev7d) / activeUsersPrev7d) * 100
        : activeUsers7d > 0 ? 100 : 0;

      const dailySignupRate = newUsersThisWeek / 7;

      // Projections
      const projectedUsers30d = Math.round(totalUsers + (dailySignupRate * 30));
      const projectedUsers90d = Math.round(totalUsers + (dailySignupRate * 90));

      // Get daily trend
      const signupTrend: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = subDays(today, i);
        const dayEnd = subDays(today, i - 1);
        const count = await prisma.user.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        });
        signupTrend.push(count);
      }

      return {
        success: true,
        data: {
          weeklySignupGrowth,
          weeklyActiveGrowth,
          dailySignupRate,
          projectedUsers30d,
          projectedUsers90d,
          signupTrend,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get growth rates',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET RETENTION METRICS
// ============================================================

interface RetentionMetricsInput {
  cohortDays?: number;
}

interface RetentionMetricsOutput {
  day7Retention: number;
  day30Retention: number;
  stickinessRatio: number;
  churnedUsers: number;
  atRiskUsers: number;
}

export const getRetentionMetricsTool: Tool<RetentionMetricsInput, RetentionMetricsOutput> = createTool(
  {
    name: 'get_retention_metrics',
    description: 'Calculate user retention metrics including D7, D30 retention, stickiness ratio, and churn indicators.',
    category: 'analytics',
    parameters: [
      {
        name: 'cohortDays',
        type: 'number',
        description: 'Days for cohort analysis (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'Retention metrics and churn indicators',
    },
  },
  async (input): Promise<ToolExecutionResult<RetentionMetricsOutput>> => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const last7d = subDays(today, 7);
      const last30d = subDays(today, 30);
      const sixtyDaysAgo = subDays(today, 60);

      const [
        activeUsers7d,
        activeUsers30d,
        usersRegistered30to60,
        usersStillActive,
        highChurnRisk,
      ] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: last7d } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: last30d } } }),
        prisma.user.count({
          where: { createdAt: { gte: sixtyDaysAgo, lt: last30d } },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: sixtyDaysAgo, lt: last30d },
            lastLoginAt: { gte: last7d },
          },
        }),
        prisma.churnPrediction.count({ where: { riskLevel: 'high' } }),
      ]);

      const day30Retention = usersRegistered30to60 > 0
        ? (usersStillActive / usersRegistered30to60) * 100
        : 0;

      const stickinessRatio = activeUsers30d > 0
        ? (activeUsers7d / activeUsers30d) * 100
        : 0;

      // Users who haven't logged in for 14+ days
      const fourteenDaysAgo = subDays(today, 14);
      const churnedUsers = await prisma.user.count({
        where: {
          lastLoginAt: { lt: fourteenDaysAgo },
          bannedAt: null,
        },
      });

      return {
        success: true,
        data: {
          day7Retention: stickinessRatio, // Using stickiness as D7 proxy
          day30Retention,
          stickinessRatio,
          churnedUsers,
          atRiskUsers: highChurnRisk,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get retention metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET FEATURE ADOPTION
// ============================================================

interface FeatureAdoptionInput {
  timeframeDays?: number;
}

interface FeatureAdoptionOutput {
  aiFeatureAdoption: number;
  screeningAdoption: number;
  communityAdoption: number;
  messagingAdoption: number;
  totalAiUsers: number;
  totalScreenings: number;
  totalPosts: number;
  totalMessages: number;
}

export const getFeatureAdoptionTool: Tool<FeatureAdoptionInput, FeatureAdoptionOutput> = createTool(
  {
    name: 'get_feature_adoption',
    description: 'Analyze feature adoption rates including AI features, screening, community posts, and messaging.',
    category: 'analytics',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Timeframe for analysis (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'Feature adoption rates and usage counts',
    },
  },
  async (input): Promise<ToolExecutionResult<FeatureAdoptionOutput>> => {
    try {
      const days = input.timeframeDays ?? 30;
      const since = subDays(new Date(), days);

      const [
        activeUsers,
        aiUsers,
        screeningCount,
        postCount,
        messageUserCount,
      ] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
        prisma.aIUsageLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: since } },
        }).then(r => r.length),
        prisma.screeningResult.count({ where: { completedAt: { gte: since } } }),
        prisma.post.count({ where: { createdAt: { gte: since } } }),
        prisma.message.groupBy({
          by: ['senderId'],
          where: { createdAt: { gte: since } },
        }).then(r => r.length),
      ]);

      const aiAdoption = activeUsers > 0 ? (aiUsers / activeUsers) * 100 : 0;
      const communityAdoption = activeUsers > 0 ? (postCount / activeUsers) * 100 : 0;
      const msgAdoption = activeUsers > 0 ? (messageUserCount / activeUsers) * 100 : 0;

      // Estimate screening adoption
      const screeningAdoption = activeUsers > 0 ? (screeningCount / activeUsers) * 100 : 0;

      return {
        success: true,
        data: {
          aiFeatureAdoption: aiAdoption,
          screeningAdoption,
          communityAdoption,
          messagingAdoption: msgAdoption,
          totalAiUsers: aiUsers,
          totalScreenings: screeningCount,
          totalPosts: postCount,
          totalMessages: messageUserCount,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get feature adoption',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET COHORT ANALYSIS
// ============================================================

interface CohortAnalysisInput {
  cohortWeeks?: number;
}

interface CohortData {
  week: string;
  usersJoined: number;
  stillActiveWeek1: number;
  stillActiveWeek2: number;
  stillActiveWeek4: number;
}

interface CohortAnalysisOutput {
  cohorts: CohortData[];
  averageWeek1Retention: number;
  averageWeek4Retention: number;
}

export const getCohortAnalysisTool: Tool<CohortAnalysisInput, CohortAnalysisOutput> = createTool(
  {
    name: 'get_cohort_analysis',
    description: 'Perform cohort analysis showing user retention by signup week.',
    category: 'analytics',
    parameters: [
      {
        name: 'cohortWeeks',
        type: 'number',
        description: 'Number of weekly cohorts to analyze (default: 4)',
        required: false,
        default: 4,
      },
    ],
    returns: {
      type: 'object',
      description: 'Cohort retention data',
    },
  },
  async (input): Promise<ToolExecutionResult<CohortAnalysisOutput>> => {
    try {
      const weeks = input.cohortWeeks ?? 4;
      const now = new Date();
      const cohorts: CohortData[] = [];

      for (let w = weeks; w >= 1; w--) {
        const weekStart = subDays(now, w * 7);
        const weekEnd = subDays(now, (w - 1) * 7);
        const week1Check = subDays(weekEnd, 0);
        const week2Check = subDays(weekEnd, -7);
        const week4Check = subDays(weekEnd, -21);

        const usersJoined = await prisma.user.count({
          where: { createdAt: { gte: weekStart, lt: weekEnd } },
        });

        const stillActiveWeek1 = await prisma.user.count({
          where: {
            createdAt: { gte: weekStart, lt: weekEnd },
            lastLoginAt: { gte: week1Check },
          },
        });

        const stillActiveWeek2 = await prisma.user.count({
          where: {
            createdAt: { gte: weekStart, lt: weekEnd },
            lastLoginAt: { gte: week2Check },
          },
        });

        const stillActiveWeek4 = await prisma.user.count({
          where: {
            createdAt: { gte: weekStart, lt: weekEnd },
            lastLoginAt: { gte: week4Check },
          },
        });

        cohorts.push({
          week: format(weekStart, 'yyyy-MM-dd'),
          usersJoined,
          stillActiveWeek1,
          stillActiveWeek2,
          stillActiveWeek4,
        });
      }

      // Calculate averages
      const validCohorts = cohorts.filter(c => c.usersJoined > 0);
      const avgWeek1 = validCohorts.length > 0
        ? validCohorts.reduce((sum, c) => sum + (c.stillActiveWeek1 / c.usersJoined) * 100, 0) / validCohorts.length
        : 0;
      const avgWeek4 = validCohorts.length > 0
        ? validCohorts.reduce((sum, c) => sum + (c.stillActiveWeek4 / c.usersJoined) * 100, 0) / validCohorts.length
        : 0;

      return {
        success: true,
        data: {
          cohorts,
          averageWeek1Retention: avgWeek1,
          averageWeek4Retention: avgWeek4,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cohort analysis',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET CHURN PREDICTIONS
// ============================================================

interface ChurnPredictionsInput {
  riskLevel?: 'high' | 'medium' | 'low';
  limit?: number;
}

interface ChurnPredictionsOutput {
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  totalAtRisk: number;
  averageChurnProbability: number;
  topRiskFactors: string[];
}

export const getChurnPredictionsTool: Tool<ChurnPredictionsInput, ChurnPredictionsOutput> = createTool(
  {
    name: 'get_churn_predictions',
    description: 'Get churn prediction data including risk counts and factors.',
    category: 'analytics',
    parameters: [
      {
        name: 'riskLevel',
        type: 'string',
        description: 'Filter by risk level (high, medium, low)',
        required: false,
        enum: ['high', 'medium', 'low'],
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Limit number of results',
        required: false,
        default: 100,
      },
    ],
    returns: {
      type: 'object',
      description: 'Churn prediction summary',
    },
  },
  async (input): Promise<ToolExecutionResult<ChurnPredictionsOutput>> => {
    try {
      const [highRisk, mediumRisk, lowRisk, allPredictions] = await Promise.all([
        prisma.churnPrediction.count({ where: { riskLevel: 'high' } }),
        prisma.churnPrediction.count({ where: { riskLevel: 'medium' } }),
        prisma.churnPrediction.count({ where: { riskLevel: 'low' } }),
        prisma.churnPrediction.findMany({
          orderBy: { churnProbability: 'desc' },
          take: input.limit ?? 100,
        }),
      ]);

      const avgProb = allPredictions.length > 0
        ? allPredictions.reduce((sum, p) => sum + p.churnProbability, 0) / allPredictions.length
        : 0;

      return {
        success: true,
        data: {
          highRiskCount: highRisk,
          mediumRiskCount: mediumRisk,
          lowRiskCount: lowRisk,
          totalAtRisk: highRisk + mediumRisk,
          averageChurnProbability: avgProb,
          topRiskFactors: ['Inactivity > 14 days', 'No feature usage', 'Declining engagement'],
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get churn predictions',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// EXPORT ALL USER TOOLS
// ============================================================

export const userTools = [
  getUserMetricsTool,
  getGrowthRatesTool,
  getRetentionMetricsTool,
  getFeatureAdoptionTool,
  getCohortAnalysisTool,
  getChurnPredictionsTool,
];
