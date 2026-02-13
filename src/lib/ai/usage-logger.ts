/**
 * Centralized AI usage logging for the Owner Dashboard.
 * Call this from all AI entry points: chat, story, agents, advisor, navigator.
 */

import { prisma } from '@/lib/prisma';

export interface LogAIUsageParams {
  feature: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  status?: 'success' | 'failed';
  userId?: string | null;
  aiJobId?: string | null;
}

/**
 * Log AI usage to AIUsageLog for dashboard aggregation.
 * Fire-and-forget: does not throw; logs errors to console.
 */
export async function logAIUsage(params: LogAIUsageParams): Promise<void> {
  const { feature, tokensUsed, responseTimeMs, status = 'success', userId, aiJobId } = params;

  try {
    await prisma.aIUsageLog.create({
      data: {
        aiJobId: aiJobId ?? null,
        userId: userId ?? null,
        feature,
        tokensUsed: tokensUsed ?? null,
        responseTimeMs: responseTimeMs ?? null,
        status,
      },
    });
  } catch (err) {
    console.error('[logAIUsage] Failed to create AIUsageLog:', err);
  }
}

/**
 * Estimate tokens for AI agent runs (plan + reasoning steps + conclusion).
 * Used when actual token count is not available from the LLM response.
 */
export function estimateAgentTokens(reasoningSteps: number): number {
  // Plan: ~500, each step: ~800, conclusion: ~500
  return 500 + Math.max(0, reasoningSteps) * 800 + 500;
}
