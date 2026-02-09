/**
 * AI Token Usage Tracking
 * 
 * Tracks token consumption per user and provides cost estimation.
 * Helps prevent runaway API costs and enables usage-based billing.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'TokenTracker' });

// Approximate token costs per 1K tokens (in USD)
const TOKEN_COSTS = {
  groq: {
    input: 0.0001,   // $0.10 per 1M tokens
    output: 0.0001,  // $0.10 per 1M tokens
  },
  gemini: {
    input: 0.000125,  // $0.125 per 1M tokens (Flash)
    output: 0.000375, // $0.375 per 1M tokens (Flash)
  },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  provider: 'groq' | 'gemini' | 'fallback';
}

export interface UserTokenStats {
  userId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

/**
 * Estimate tokens from text (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  provider: 'groq' | 'gemini' | 'fallback'
): number {
  if (provider === 'fallback') return 0;

  const costs = TOKEN_COSTS[provider];
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Track token usage for a chat request
 */
export async function trackTokenUsage(
  userId: string,
  jobId: string,
  messages: Array<{ role: string; content: string }>,
  response: string,
  provider: 'groq' | 'gemini' | 'fallback'
): Promise<TokenUsage> {
  try {
    // Estimate tokens
    const inputTokens = messages.reduce(
      (sum, m) => sum + estimateTokens(m.content),
      0
    );
    const outputTokens = estimateTokens(response);
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const estimatedCost = calculateCost(inputTokens, outputTokens, provider);

    // Store in database
    await prisma.aITokenUsage.create({
      data: {
        userId,
        jobId,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost,
        provider,
      },
    });

    logger.debug({
      userId,
      jobId,
      totalTokens,
      estimatedCost,
      provider,
    }, 'Token usage tracked');

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      provider,
    };
  } catch (error) {
    // Don't fail the request if tracking fails
    logger.error({ error, userId, jobId }, 'Failed to track token usage');
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      provider,
    };
  }
}

/**
 * Get token usage statistics for a user
 */
export async function getUserTokenStats(
  userId: string,
  days: number = 30
): Promise<UserTokenStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [dailyUsage, aggregate] = await Promise.all([
    // Daily breakdown
    prisma.$queryRaw<Array<{
      date: string;
      tokens: bigint;
      cost: bigint;
      requests: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        SUM(total_tokens) as tokens,
        SUM(estimated_cost) as cost,
        COUNT(*) as requests
      FROM ai_token_usages
      WHERE user_id = ${userId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
    // All-time totals
    prisma.aITokenUsage.aggregate({
      where: { userId },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    }),
  ]);

  return {
    userId,
    totalRequests: aggregate._count || 0,
    totalTokens: aggregate._sum.totalTokens || 0,
    totalCost: aggregate._sum.estimatedCost || 0,
    dailyUsage: (dailyUsage || []).map((day) => ({
      date: day.date,
      tokens: Number(day.tokens),
      cost: Number(day.cost),
      requests: Number(day.requests),
    })),
  };
}

/**
 * Get system-wide token usage (admin only)
 */
export async function getSystemTokenStats(
  days: number = 30
): Promise<{
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totals, byProvider, dailyUsage] = await Promise.all([
    prisma.aITokenUsage.aggregate({
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    }),
    prisma.aITokenUsage.groupBy({
      by: ['provider'],
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    }),
    prisma.$queryRaw<Array<{
      date: string;
      tokens: bigint;
      cost: bigint;
      requests: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        SUM(total_tokens) as tokens,
        SUM(estimated_cost) as cost,
        COUNT(*) as requests
      FROM ai_token_usages
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  ]);

  const providerStats: Record<string, { tokens: number; cost: number; requests: number }> = {};
  for (const p of byProvider) {
    providerStats[p.provider] = {
      tokens: p._sum.totalTokens || 0,
      cost: p._sum.estimatedCost || 0,
      requests: p._count,
    };
  }

  return {
    totalRequests: totals._count || 0,
    totalTokens: totals._sum.totalTokens || 0,
    totalCost: totals._sum.estimatedCost || 0,
    byProvider: providerStats,
    dailyUsage: dailyUsage.map((day) => ({
      date: day.date,
      tokens: Number(day.tokens),
      cost: Number(day.cost),
      requests: Number(day.requests),
    })),
  };
}

/**
 * Check if user has exceeded their token limit
 */
export async function checkTokenLimit(
  userId: string,
  dailyLimit: number = 10000
): Promise<{ allowed: boolean; remaining: number; used: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.aITokenUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: today },
    },
    _sum: {
      totalTokens: true,
    },
  });

  const used = result._sum.totalTokens || 0;
  const remaining = Math.max(0, dailyLimit - used);

  return {
    allowed: used < dailyLimit,
    remaining,
    used,
  };
}
