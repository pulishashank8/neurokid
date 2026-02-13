/**
 * Data Quality Cron
 * Run daily via Vercel Cron
 *
 * MANDATORY: Passes through reasoning engine (requirement 7).
 * Invokes BUSINESS_ANALYST agent which:
 * - Calls run_data_quality_monitor tool
 * - May call get_data_quality_metrics, query_past_insights
 * - Generates structured report with computed confidence
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runAgentWithGoal, formatReportForAPI } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

const DATA_QUALITY_GOAL = `Run data quality monitoring and assess platform data health.
Call run_data_quality_monitor to compute metrics, then use get_data_quality_metrics if needed.
Report on: profile completeness, stale users, duplicates, and recommended actions.`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAgentWithGoal('BUSINESS_ANALYST', DATA_QUALITY_GOAL);

    logAIUsage({
      feature: 'ai_agent_BUSINESS_ANALYST',
      tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
      responseTimeMs: result.report?.executionTimeMs ?? undefined,
      status: result.success ? 'success' : 'failed',
    }).catch(() => {});

    return NextResponse.json({
      ok: result.success,
      message: result.success ? 'Data quality analysis completed via AI agent' : result.error,
      agentType: 'BUSINESS_ANALYST',
      report: result.report ? formatReportForAPI(result.report) : null,
    });
  } catch (error) {
    console.error('[Cron] Data quality (AI agent) failed:', error);
    return NextResponse.json(
      {
        error: 'Data quality failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
