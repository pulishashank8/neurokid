import { NextResponse } from 'next/server';
import {
  runAgent,
  runAllAgentsWithOrchestratorResult,
  runAgentsBySchedule,
  formatReportForAPI,
} from '@/lib/agents';
import type { AgentType } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

/**
 * Cron job to run AI agents on schedule
 *
 * This endpoint uses the TRUE AI Agent architecture with:
 * - Goal-driven reasoning via Groq LLM
 * - ReAct loop (Think → Act → Observe → Refine)
 * - Dynamic tool selection by LLM
 * - Short-term and long-term memory
 * - Structured executive reports with computed confidence
 *
 * Schedules:
 * - Every 15 minutes: UX_AGENT, SECURITY_SENTINEL
 * - Hourly: BUSINESS_ANALYST, CONTENT_INTELLIGENCE
 * - Every 6 hours: LEGAL_COMPLIANCE
 * - Daily: GROWTH_STRATEGIST, CHURN_PREDICTOR
 *
 * Query params:
 * - agent: Run a specific agent (e.g., ?agent=GROWTH_STRATEGIST)
 * - schedule: Run agents by schedule (e.g., ?schedule=hourly)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agent') as AgentType | null;
    const schedule = searchParams.get('schedule') as '15min' | 'hourly' | '6h' | 'daily' | null;

    let response: Record<string, unknown>;

    if (agentType) {
      // Run a specific agent
      const result = await runAgent(agentType);

      logAIUsage({
        feature: `ai_agent_${agentType}`,
        tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
        responseTimeMs: result.report?.executionTimeMs ?? undefined,
        status: result.success ? 'success' : 'failed',
      }).catch(() => {});

      response = {
        success: result.success,
        agentType,
        timestamp: new Date().toISOString(),
        report: result.report ? formatReportForAPI(result.report) : null,
        error: result.error,
        session: {
          id: result.session.id,
          status: result.session.status,
          reasoningSteps: result.session.currentStep,
          goal: result.session.goal,
        },
      };
    } else if (schedule) {
      // Run agents by schedule
      const results = await runAgentsBySchedule(schedule);

      for (const [type, result] of results) {
        logAIUsage({
          feature: `ai_agent_${type}`,
          tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
          responseTimeMs: result.report?.executionTimeMs ?? undefined,
          status: result.success ? 'success' : 'failed',
        }).catch(() => {});
      }

      const agentResults: Record<string, unknown>[] = [];
      let hasErrors = false;

      for (const [type, result] of results) {
        agentResults.push({
          agentType: type,
          success: result.success,
          report: result.report ? formatReportForAPI(result.report) : null,
          error: result.error,
        });
        if (!result.success) hasErrors = true;
      }

      // Run Issue Fixer after scheduled agents
      try {
        const { runIssueFixerAgent } = await import('@/lib/owner/agents/issue-fixer');
        await runIssueFixerAgent({ now: new Date() });
      } catch (e) {
        console.warn('[AI Agents Cron] Issue Fixer failed:', e);
      }

      response = {
        success: !hasErrors,
        schedule,
        timestamp: new Date().toISOString(),
        agentsRun: agentResults.length,
        results: agentResults,
      };
    } else {
      // Run all agents
      const orchestratorResult = await runAllAgentsWithOrchestratorResult();

      for (const r of orchestratorResult.results) {
        const steps = typeof r.report?.reasoningSteps === 'number' ? r.report.reasoningSteps : 0;
        logAIUsage({
          feature: `ai_agent_${r.agentType}`,
          tokensUsed: estimateAgentTokens(steps),
          responseTimeMs: r.executionTimeMs || undefined,
          status: r.success ? 'success' : 'failed',
        }).catch(() => {});
      }

      response = {
        success: orchestratorResult.success,
        timestamp: new Date().toISOString(),
        totalAgents: orchestratorResult.results.length,
        totalInsights: orchestratorResult.totalInsights,
        totalExecutionTimeMs: orchestratorResult.totalExecutionTimeMs,
        results: orchestratorResult.results.map(r => ({
          agentType: r.agentType,
          success: r.success,
          executionTimeMs: r.executionTimeMs,
          report: r.report ? {
            executiveSummary: r.report.executiveSummary,
            confidenceScore: r.report.confidenceScore,
            recommendationsCount: r.report.recommendations?.length ?? 0,
            risksCount: r.report.detectedRisks?.length ?? 0,
          } : null,
          error: r.error,
        })),
        errors: orchestratorResult.errors,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AI Agents Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run agents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
