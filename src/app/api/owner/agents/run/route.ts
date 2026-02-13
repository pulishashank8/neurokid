import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  runAgent,
  runAgentWithGoal,
  runAllAgentsWithOrchestratorResult,
  formatReportForAPI,
} from '@/lib/agents';
import type { AgentType } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

/**
 * POST /api/owner/agents/run
 * Manually triggers AI agents using the TRUE AI Agent architecture
 *
 * Body options:
 * - { agentType: "DATA_ANALYST" } - Run a specific agent (scheduled goal)
 * - { agentType: "DATA_ANALYST", goal: "What's our engagement trend?" } - Ad-hoc analytical question
 * - { } or no body - Run all agents
 *
 * Each agent uses:
 * - Goal-driven reasoning via Groq LLM
 * - ReAct loop (Think → Act → Observe → Refine)
 * - Dynamic tool selection
 * - Short-term memory within session
 * - Long-term memory from past insights
 */
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body: { agentType?: AgentType; goal?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, will run all agents
    }

    if (body.agentType) {
      // Run a specific agent (custom goal for ad-hoc analysis, e.g. Data Analyst questions)
      const result = body.goal
        ? await runAgentWithGoal(body.agentType, body.goal)
        : await runAgent(body.agentType);

      // Log AI usage for dashboard aggregation
      const steps = result.session?.currentStep ?? 0;
      logAIUsage({
        feature: `ai_agent_${body.agentType}`,
        tokensUsed: estimateAgentTokens(steps),
        responseTimeMs: result.report?.executionTimeMs ?? undefined,
        status: result.success ? 'success' : 'failed',
      }).catch(() => {});

      return NextResponse.json({
        success: result.success,
        agentType: body.agentType,
        report: result.report ? formatReportForAPI(result.report) : null,
        session: {
          id: result.session.id,
          status: result.session.status,
          reasoningSteps: result.session.currentStep,
          goal: result.session.goal,
          plan: {
            subGoals: result.session.plan.subGoals,
            requiredTools: result.session.plan.requiredTools,
          },
        },
        error: result.error,
        message: result.success
          ? `${body.agentType} executed successfully with ${result.session.currentStep} reasoning steps`
          : `${body.agentType} execution failed`,
      });
    } else {
      // Run all detector agents first
      const orchestratorResult = await runAllAgentsWithOrchestratorResult();

      // Then run Issue Fixer to auto-remediate unresolved insights
      try {
        const { runIssueFixerAgent } = await import('@/lib/owner/agents/issue-fixer');
        await runIssueFixerAgent({ now: new Date() });
      } catch (e) {
        console.warn('[Agent Run] Issue Fixer failed:', e);
      }

      // Log AI usage for each agent run
      for (const r of orchestratorResult.results) {
        const steps = typeof r.report?.reasoningSteps === 'number' ? r.report.reasoningSteps : 0;
        logAIUsage({
          feature: `ai_agent_${r.agentType}`,
          tokensUsed: estimateAgentTokens(steps),
          responseTimeMs: r.executionTimeMs || undefined,
          status: r.success ? 'success' : 'failed',
        }).catch(() => {});
      }

      return NextResponse.json({
        success: orchestratorResult.success,
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
            keyMetricsCount: r.report.keyMetrics?.length ?? 0,
            recommendationsCount: r.report.recommendations?.length ?? 0,
            risksCount: r.report.detectedRisks?.length ?? 0,
            toolsUsed: r.report.toolsUsed,
          } : null,
          error: r.error,
        })),
        errors: orchestratorResult.errors,
        message: orchestratorResult.success
          ? 'All agents executed successfully'
          : `Completed with ${orchestratorResult.errors.length} errors`,
      });
    }
  } catch (error) {
    console.error('[Agent Run] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run agents', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
