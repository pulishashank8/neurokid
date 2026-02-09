import { NextResponse } from 'next/server';
import { withApiHandler, AuthenticatedRequest } from '@/lib/api';
import { getUserTokenStats } from '@/lib/ai/token-tracker';
import { checkCostLimits, getCostLimitConfig } from '@/lib/ai/cost-limiter';

/**
 * GET /api/user/ai-usage - Get current user's AI usage and limits
 */
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const userId = request.session.user.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get usage stats and current limits in parallel
    const [stats, limits, limitConfig] = await Promise.all([
      getUserTokenStats(userId, days),
      checkCostLimits(userId),
      getCostLimitConfig(),
    ]);

    return NextResponse.json({
      usage: {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        dailyBreakdown: stats.dailyUsage,
      },
      limits: {
        current: {
          tokensUsed: limits.currentUsage.tokens,
          costUsed: limits.currentUsage.cost,
          tokensRemaining: limits.remaining.tokens,
          costRemaining: limits.remaining.cost,
        },
        daily: {
          tokens: limitConfig.userDailyTokens,
          cost: limitConfig.userDailyCost,
        },
        isAtLimit: !limits.allowed,
      },
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/user/ai-usage',
    requireAuth: true,
    rateLimit: 'readPost',
  }
);
