/**
 * AI Cost Limiting
 * 
 * Prevents runaway API costs by enforcing limits on:
 * - Daily token usage per user
 * - Daily spend per user
 * - System-wide daily spend
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { checkTokenLimit, getSystemTokenStats } from './token-tracker';

const logger = createLogger({ context: 'CostLimiter' });

// Default limits
const DEFAULT_USER_DAILY_TOKENS = 10000;    // 10K tokens per day
const DEFAULT_USER_DAILY_COST = 0.50;       // $0.50 per day
const DEFAULT_SYSTEM_DAILY_COST = 100.00;   // $100 system-wide per day

// Cost limit configuration from environment
const COST_LIMITS = {
  userDailyTokens: parseInt(process.env.AI_USER_DAILY_TOKENS || '10000', 10),
  userDailyCost: parseFloat(process.env.AI_USER_DAILY_COST || '0.50'),
  systemDailyCost: parseFloat(process.env.AI_SYSTEM_DAILY_COST || '100.00'),
  alertThreshold: parseFloat(process.env.AI_COST_ALERT_THRESHOLD || '0.8'), // Alert at 80%
};

export interface CostLimitCheck {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    tokens: number;
    cost: number;
  };
  limits: {
    tokens: number;
    cost: number;
  };
  remaining: {
    tokens: number;
    cost: number;
  };
}

/**
 * Check if a user can make an AI request within cost limits
 */
export async function checkCostLimits(userId: string): Promise<CostLimitCheck> {
  try {
    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userUsage = await prisma.aITokenUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
    });

    const systemUsage = await prisma.aITokenUsage.aggregate({
      where: {
        createdAt: { gte: today },
      },
      _sum: {
        estimatedCost: true,
      },
    });

    const currentTokens = userUsage._sum.totalTokens || 0;
    const currentCost = userUsage._sum.estimatedCost || 0;
    const systemCost = systemUsage._sum.estimatedCost || 0;

    // Check system-wide limit first
    if (systemCost >= COST_LIMITS.systemDailyCost) {
      logger.warn({
        systemCost,
        limit: COST_LIMITS.systemDailyCost,
      }, 'System daily cost limit exceeded');

      return {
        allowed: false,
        reason: 'System is temporarily unavailable due to high demand. Please try again later.',
        currentUsage: { tokens: currentTokens, cost: currentCost },
        limits: {
          tokens: COST_LIMITS.userDailyTokens,
          cost: COST_LIMITS.userDailyCost,
        },
        remaining: { tokens: 0, cost: 0 },
      };
    }

    // Check user token limit
    if (currentTokens >= COST_LIMITS.userDailyTokens) {
      return {
        allowed: false,
        reason: `Daily token limit reached (${COST_LIMITS.userDailyTokens.toLocaleString()} tokens). Limit resets at midnight UTC.`,
        currentUsage: { tokens: currentTokens, cost: currentCost },
        limits: {
          tokens: COST_LIMITS.userDailyTokens,
          cost: COST_LIMITS.userDailyCost,
        },
        remaining: { tokens: 0, cost: 0 },
      };
    }

    // Check user cost limit
    if (currentCost >= COST_LIMITS.userDailyCost) {
      return {
        allowed: false,
        reason: `Daily cost limit reached ($${COST_LIMITS.userDailyCost.toFixed(2)}). Limit resets at midnight UTC.`,
        currentUsage: { tokens: currentTokens, cost: currentCost },
        limits: {
          tokens: COST_LIMITS.userDailyTokens,
          cost: COST_LIMITS.userDailyCost,
        },
        remaining: { tokens: 0, cost: 0 },
      };
    }

    // Calculate remaining budget
    const remainingTokens = COST_LIMITS.userDailyTokens - currentTokens;
    const remainingCost = COST_LIMITS.userDailyCost - currentCost;

    // Log if approaching limits (80% threshold)
    const tokenRatio = currentTokens / COST_LIMITS.userDailyTokens;
    const costRatio = currentCost / COST_LIMITS.userDailyCost;

    if (tokenRatio >= COST_LIMITS.alertThreshold || costRatio >= COST_LIMITS.alertThreshold) {
      logger.info({
        userId,
        currentTokens,
        currentCost,
        tokenRatio: Math.round(tokenRatio * 100),
        costRatio: Math.round(costRatio * 100),
      }, 'User approaching AI cost limits');
    }

    return {
      allowed: true,
      currentUsage: { tokens: currentTokens, cost: currentCost },
      limits: {
        tokens: COST_LIMITS.userDailyTokens,
        cost: COST_LIMITS.userDailyCost,
      },
      remaining: {
        tokens: remainingTokens,
        cost: remainingCost,
      },
    };
  } catch (error) {
    logger.error({ error, userId }, 'Error checking cost limits');
    // Fail closed - deny if we can't verify limits
    return {
      allowed: false,
      reason: 'Unable to verify usage limits. Please try again.',
      currentUsage: { tokens: 0, cost: 0 },
      limits: {
        tokens: COST_LIMITS.userDailyTokens,
        cost: COST_LIMITS.userDailyCost,
      },
      remaining: { tokens: 0, cost: 0 },
    };
  }
}

/**
 * Get cost limit configuration
 */
export function getCostLimitConfig(): {
  userDailyTokens: number;
  userDailyCost: number;
  systemDailyCost: number;
  alertThreshold: number;
} {
  return { ...COST_LIMITS };
}

/**
 * Check system-wide cost status for admin monitoring
 */
export async function getSystemCostStatus(): Promise<{
  currentSpend: number;
  limit: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
  estimatedMonthlySpend: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.aITokenUsage.aggregate({
    where: {
      createdAt: { gte: today },
    },
    _sum: {
      estimatedCost: true,
    },
  });

  const currentSpend = result._sum.estimatedCost || 0;
  const percentage = (currentSpend / COST_LIMITS.systemDailyCost) * 100;

  // Get last 7 days for monthly estimate
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklySpend = await prisma.aITokenUsage.aggregate({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    _sum: {
      estimatedCost: true,
    },
  });

  const weeklyCost = weeklySpend._sum.estimatedCost || 0;
  const estimatedMonthlySpend = (weeklyCost / 7) * 30;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (percentage >= 100) {
    status = 'critical';
  } else if (percentage >= COST_LIMITS.alertThreshold * 100) {
    status = 'warning';
  }

  return {
    currentSpend,
    limit: COST_LIMITS.systemDailyCost,
    percentage,
    status,
    estimatedMonthlySpend,
  };
}

/**
 * Get top users by AI cost (admin monitoring)
 */
export async function getTopUsersByCost(
  limit: number = 10,
  days: number = 7
): Promise<Array<{
  userId: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await prisma.$queryRaw<Array<{
    user_id: string;
    total_tokens: bigint;
    total_cost: number;
    request_count: bigint;
  }>>`
    SELECT 
      user_id,
      SUM(total_tokens) as total_tokens,
      SUM(estimated_cost) as total_cost,
      COUNT(*) as request_count
    FROM ai_token_usages
    WHERE created_at >= ${startDate}
    GROUP BY user_id
    ORDER BY total_cost DESC
    LIMIT ${limit}
  `;

  return results.map(r => ({
    userId: r.user_id,
    totalTokens: Number(r.total_tokens),
    totalCost: r.total_cost,
    requestCount: Number(r.request_count),
  }));
}
