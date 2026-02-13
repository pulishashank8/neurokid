/**
 * AI Agent Orchestrator
 * Coordinates running all agents and storing their insights
 */

import { prisma } from '@/lib/prisma';
import type { AgentType, AgentResult, AgentContext, AgentInsight } from './types';
import { AGENT_CONFIGS } from './types';
import { runBusinessAnalystAgent } from './business-analyst';
import { runLegalComplianceAgent } from './legal-compliance';
import { runUXAgent } from './ux-agent';
import { runContentIntelligenceAgent } from './content-intelligence';
import { runSecuritySentinelAgent } from './security-sentinel';
import { runGrowthStrategistAgent } from './growth-strategist';

type AgentRunner = (context: AgentContext) => Promise<AgentResult>;

const AGENT_RUNNERS: Record<AgentType, AgentRunner> = {
  BUSINESS_ANALYST: runBusinessAnalystAgent,
  LEGAL_COMPLIANCE: runLegalComplianceAgent,
  UX_AGENT: runUXAgent,
  CONTENT_INTELLIGENCE: runContentIntelligenceAgent,
  SECURITY_SENTINEL: runSecuritySentinelAgent,
  GROWTH_STRATEGIST: runGrowthStrategistAgent,
};

export interface OrchestratorResult {
  success: boolean;
  results: AgentResult[];
  totalInsights: number;
  savedInsights: number;
  totalExecutionTimeMs: number;
  errors: string[];
}

/**
 * Run a single agent by type
 */
export async function runAgent(agentType: AgentType): Promise<AgentResult> {
  const runner = AGENT_RUNNERS[agentType];
  if (!runner) {
    return {
      agentType,
      success: false,
      insights: [],
      executionTimeMs: 0,
      error: `Unknown agent type: ${agentType}`,
    };
  }

  const context: AgentContext = { now: new Date() };
  return runner(context);
}

/**
 * Run all enabled agents
 */
export async function runAllAgents(): Promise<OrchestratorResult> {
  const start = Date.now();
  const errors: string[] = [];
  const results: AgentResult[] = [];
  let savedInsights = 0;

  const enabledAgents = AGENT_CONFIGS.filter(a => a.enabled);

  // Run all agents in parallel
  const agentPromises = enabledAgents.map(async (config) => {
    try {
      const result = await runAgent(config.type);
      results.push(result);

      if (!result.success && result.error) {
        errors.push(`${config.name}: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${config.name}: ${errorMsg}`);
      return {
        agentType: config.type,
        success: false,
        insights: [],
        executionTimeMs: 0,
        error: errorMsg,
      } as AgentResult;
    }
  });

  await Promise.all(agentPromises);

  // Collect all insights
  const allInsights = results.flatMap(r => r.insights);

  // Save insights to database
  for (const insight of allInsights) {
    try {
      await saveInsight(insight);
      savedInsights++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to save insight: ${errorMsg}`);
    }
  }

  return {
    success: errors.length === 0,
    results,
    totalInsights: allInsights.length,
    savedInsights,
    totalExecutionTimeMs: Date.now() - start,
    errors,
  };
}

/**
 * Run agents by schedule type
 */
export async function runAgentsBySchedule(schedule: '15min' | 'hourly' | '6h' | 'daily'): Promise<OrchestratorResult> {
  const scheduleMap: Record<string, AgentType[]> = {
    '15min': ['UX_AGENT', 'SECURITY_SENTINEL'],
    'hourly': ['BUSINESS_ANALYST', 'CONTENT_INTELLIGENCE'],
    '6h': ['LEGAL_COMPLIANCE'],
    'daily': ['GROWTH_STRATEGIST'],
  };

  const agentTypes = scheduleMap[schedule] || [];
  const start = Date.now();
  const errors: string[] = [];
  const results: AgentResult[] = [];
  let savedInsights = 0;

  for (const agentType of agentTypes) {
    try {
      const result = await runAgent(agentType);
      results.push(result);

      if (result.success) {
        for (const insight of result.insights) {
          try {
            await saveInsight(insight);
            savedInsights++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Failed to save insight: ${errorMsg}`);
          }
        }
      } else if (result.error) {
        errors.push(`${agentType}: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${agentType}: ${errorMsg}`);
    }
  }

  return {
    success: errors.length === 0,
    results,
    totalInsights: results.reduce((sum, r) => sum + r.insights.length, 0),
    savedInsights,
    totalExecutionTimeMs: Date.now() - start,
    errors,
  };
}

/**
 * Save an insight to the database
 */
async function saveInsight(insight: AgentInsight): Promise<void> {
  await prisma.aIAgentInsight.create({
    data: {
      agentType: insight.agentType,
      category: insight.category,
      severity: insight.severity,
      title: insight.title,
      description: insight.description,
      recommendation: insight.recommendation,
      metrics: insight.metrics as Record<string, unknown>,
      confidence: insight.confidence,
    },
  });
}

/**
 * Get recent insights from all agents
 */
export async function getRecentInsights(options?: {
  agentType?: AgentType;
  severity?: 'info' | 'warning' | 'critical';
  limit?: number;
  unreadOnly?: boolean;
}) {
  const where: Record<string, unknown> = {};

  if (options?.agentType) {
    where.agentType = options.agentType;
  }
  if (options?.severity) {
    where.severity = options.severity;
  }
  if (options?.unreadOnly) {
    where.isRead = false;
  }

  return prisma.aIAgentInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  });
}

/**
 * Mark insights as read
 */
export async function markInsightsAsRead(insightIds: string[]) {
  return prisma.aIAgentInsight.updateMany({
    where: { id: { in: insightIds } },
    data: { isRead: true },
  });
}

/**
 * Resolve an insight
 */
export async function resolveInsight(insightId: string) {
  return prisma.aIAgentInsight.update({
    where: { id: insightId },
    data: { isResolved: true, resolvedAt: new Date() },
  });
}

/**
 * Get agent status summary
 */
export async function getAgentStatusSummary() {
  const configs = AGENT_CONFIGS;
  const recentInsights = await prisma.aIAgentInsight.groupBy({
    by: ['agentType'],
    _count: true,
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const insightsByAgent = Object.fromEntries(
    recentInsights.map(r => [r.agentType, r._count])
  );

  return configs.map(config => ({
    ...config,
    insights24h: insightsByAgent[config.type] || 0,
  }));
}
