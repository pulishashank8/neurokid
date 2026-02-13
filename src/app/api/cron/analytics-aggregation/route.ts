/**
 * Analytics Aggregation Cron
 * Run daily via Vercel Cron
 *
 * MANDATORY: Passes through reasoning engine (requirement 7).
 * Invokes BUSINESS_ANALYST agent which:
 * - Calls run_analytics_aggregation tool (retention, lifecycle, data quality)
 * - May call get_retention_metrics, get_lifecycle_metrics, get_data_quality_metrics
 * - Generates structured report on platform analytics health
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runAgentWithGoal, formatReportForAPI } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

const ANALYTICS_GOAL = `Run analytics aggregation: retention calculation, lifecycle calculation, and data quality monitoring.
Call run_analytics_aggregation to compute all metrics, then assess platform analytics health.
Report on retention, lifecycle stages, data quality, and any concerns.`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAgentWithGoal('BUSINESS_ANALYST', ANALYTICS_GOAL);

    logAIUsage({
      feature: 'ai_agent_BUSINESS_ANALYST',
      tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
      responseTimeMs: result.report?.executionTimeMs ?? undefined,
      status: result.success ? 'success' : 'failed',
    }).catch(() => {});

    return NextResponse.json({
      ok: result.success,
      message: result.success ? 'Analytics aggregation completed via AI agent' : result.error,
      agentType: 'BUSINESS_ANALYST',
      report: result.report ? formatReportForAPI(result.report) : null,
    });
  } catch (error) {
    console.error('[Cron] Analytics aggregation (AI agent) failed:', error);
    return NextResponse.json(
      {
        error: 'Analytics aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
