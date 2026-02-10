/**
 * AI Audit Logger
 * 
 * Comprehensive audit logging for AI interactions to ensure
 * compliance, debugging capability, and safety monitoring.
 * 
 * Logs are stored in the database with PII redaction for privacy.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { redactMessagesPII, detectPII } from './pii-detection';

const logger = createLogger({ context: 'AIAuditLogger' });

export interface AIInteractionLog {
  userId: string;
  jobId: string;
  conversationId: string;
  action: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'SAFETY_BLOCK' | 'RATE_LIMIT' | 'COST_LIMIT';
  messages?: Array<{ role: string; content: string }>;
  response?: string;
  provider?: string;
  model?: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  latencyMs?: number;
  error?: string;
  safetyFlags?: string[];
  metadata?: Record<string, unknown>;
}

export interface AIInteractionQuery {
  userId?: string;
  conversationId?: string;
  jobId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  hasError?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Log an AI interaction
 */
export async function logAIInteraction(
  interaction: AIInteractionLog,
  request?: Request
): Promise<void> {
  try {
    // Redact PII from messages
    const redactedMessages = interaction.messages
      ? redactMessagesPII(interaction.messages)
      : undefined;

    // Redact PII from response
    const redactedResponse = interaction.response
      ? detectPII(interaction.response).redacted
      : undefined;

    // Extract IP and user agent if request provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  request.headers.get('x-real-ip') ||
                  undefined;
      userAgent = request.headers.get('user-agent') || undefined;
    }

    // Store in database
    await prisma.aIInteractionLog.create({
      data: {
        userId: interaction.userId,
        jobId: interaction.jobId,
        conversationId: interaction.conversationId,
        action: interaction.action,
        messages: redactedMessages
          ? (redactedMessages as unknown as undefined)
          : undefined,
        response: redactedResponse,
        provider: interaction.provider,
        model: interaction.model,
        inputTokens: interaction.tokens?.input,
        outputTokens: interaction.tokens?.output,
        totalTokens: interaction.tokens?.total,
        cost: interaction.cost,
        latencyMs: interaction.latencyMs,
        error: interaction.error,
        safetyFlags: interaction.safetyFlags,
        ipAddress,
        userAgent,
        metadata: interaction.metadata as unknown as undefined,
      },
    });

    // Also log to application logger for real-time monitoring
    logger.info(
      {
        userId: interaction.userId,
        jobId: interaction.jobId,
        action: interaction.action,
        provider: interaction.provider,
        tokens: interaction.tokens?.total,
        cost: interaction.cost,
        latencyMs: interaction.latencyMs,
        hasError: !!interaction.error,
        safetyFlags: interaction.safetyFlags,
      },
      'AI interaction logged'
    );
  } catch (error) {
    // Never fail the user request if logging fails
    logger.error({ error, jobId: interaction.jobId }, 'Failed to log AI interaction');
  }
}

/**
 * Query AI interaction logs (admin only)
 */
export async function queryAIInteractions(
  query: AIInteractionQuery
): Promise<Array<{
  id: string;
  userId: string;
  jobId: string;
  conversationId: string;
  action: string;
  provider?: string;
  tokens?: number;
  cost?: number;
  latencyMs?: number;
  error?: string;
  safetyFlags?: string[];
  createdAt: Date;
}>> {
  const logs = await prisma.aIInteractionLog.findMany({
    where: {
      userId: query.userId,
      conversationId: query.conversationId,
      jobId: query.jobId,
      action: query.action,
      createdAt: {
        gte: query.startDate,
        lte: query.endDate,
      },
      error: query.hasError !== undefined
        ? query.hasError ? { not: null } : null
        : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit || 100,
    skip: query.offset || 0,
  });

  return logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    jobId: log.jobId,
    conversationId: log.conversationId,
    action: log.action,
    provider: log.provider || undefined,
    tokens: log.totalTokens || undefined,
    cost: log.cost || undefined,
    latencyMs: log.latencyMs || undefined,
    error: log.error || undefined,
    safetyFlags: (log.safetyFlags as string[]) || undefined,
    createdAt: log.createdAt,
  }));
}

/**
 * Get AI usage statistics for a user
 */
export async function getUserAIStats(
  userId: string,
  days: number = 30
): Promise<{
  totalInteractions: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  safetyFlags: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totals, errors, safety] = await Promise.all([
    prisma.aIInteractionLog.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: {
        totalTokens: true,
        cost: true,
        latencyMs: true,
      },
    }),
    prisma.aIInteractionLog.count({
      where: {
        userId,
        createdAt: { gte: startDate },
        error: { not: undefined },
      },
    }),
    prisma.aIInteractionLog.count({
      where: {
        userId,
        createdAt: { gte: startDate },
        safetyFlags: { not: undefined },
      },
    }),
  ]);

  const totalCount = totals._count || 0;

  return {
    totalInteractions: totalCount,
    totalTokens: totals._sum.totalTokens || 0,
    totalCost: totals._sum.cost || 0,
    averageLatency: totalCount > 0
      ? (totals._sum.latencyMs || 0) / totalCount
      : 0,
    errorRate: totalCount > 0 ? errors / totalCount : 0,
    safetyFlags: safety,
  };
}

/**
 * Get system-wide AI statistics (admin only)
 */
export async function getSystemAIStats(
  days: number = 30
): Promise<{
  totalInteractions: number;
  uniqueUsers: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
  safetyFlags: number;
  topProviders: Array<{ provider: string; count: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totals, uniqueUsers, errors, safety, providers] = await Promise.all([
    prisma.aIInteractionLog.aggregate({
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: {
        totalTokens: true,
        cost: true,
      },
    }),
    prisma.aIInteractionLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
      },
    }),
    prisma.aIInteractionLog.count({
      where: {
        createdAt: { gte: startDate },
        error: { not: undefined },
      },
    }),
    prisma.aIInteractionLog.count({
      where: {
        createdAt: { gte: startDate },
        safetyFlags: { not: undefined },
      },
    }),
    prisma.aIInteractionLog.groupBy({
      by: ['provider'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    }),
  ]);

  const totalCount = totals._count || 0;

  return {
    totalInteractions: totalCount,
    uniqueUsers: uniqueUsers.length,
    totalTokens: totals._sum.totalTokens || 0,
    totalCost: totals._sum.cost || 0,
    errorRate: totalCount > 0 ? errors / totalCount : 0,
    safetyFlags: safety,
    topProviders: providers.map((p) => ({
      provider: p.provider || 'unknown',
      count: p._count,
    })),
  };
}

/**
 * Export logs for compliance/GDPR
 */
export async function exportUserAIInteractions(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<Record<string, unknown>>> {
  const logs = await prisma.aIInteractionLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return logs.map((log) => ({
    id: log.id,
    jobId: log.jobId,
    conversationId: log.conversationId,
    action: log.action,
    provider: log.provider,
    model: log.model,
    tokens: {
      input: log.inputTokens,
      output: log.outputTokens,
      total: log.totalTokens,
    },
    cost: log.cost,
    latencyMs: log.latencyMs,
    error: log.error,
    safetyFlags: log.safetyFlags,
    createdAt: log.createdAt.toISOString(),
    metadata: log.metadata,
  }));
}
