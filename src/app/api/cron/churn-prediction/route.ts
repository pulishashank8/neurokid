/**
 * Churn Prediction Cron
 * Run nightly via Vercel Cron
 *
 * MANDATORY: Passes through reasoning engine (requirement 7).
 * Invokes CHURN_PREDICTOR agent which:
 * - Plans analysis via LLM
 * - Calls compute_churn_scores tool (deterministic pipeline as data source)
 * - May call get_churn_predictions, get_retention_metrics, get_cohort_analysis
 * - Queries past insights for recurring patterns
 * - Generates structured executive report with computed confidence
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runAgent, formatReportForAPI } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAgent('CHURN_PREDICTOR');

    logAIUsage({
      feature: 'ai_agent_CHURN_PREDICTOR',
      tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
      responseTimeMs: result.report?.executionTimeMs ?? undefined,
      status: result.success ? 'success' : 'failed',
    }).catch(() => {});

    if (result.success) {
      import("@/lib/owner/event-bus").then(({ emitRealtimeEvent }) =>
        emitRealtimeEvent({
          eventType: "CHURN_SCAN_COMPLETE",
          entityType: "ChurnScan",
          metadata: {},
        })
      ).catch(() => {});
    }

    return NextResponse.json({
      ok: result.success,
      message: result.success ? 'Churn analysis completed via AI agent' : result.error,
      agentType: 'CHURN_PREDICTOR',
      report: result.report ? formatReportForAPI(result.report) : null,
      session: result.session
        ? {
            id: result.session.id,
            status: result.session.status,
            reasoningSteps: result.session.currentStep,
          }
        : null,
    });
  } catch (error) {
    console.error('[Cron] Churn prediction (AI agent) failed:', error);
    return NextResponse.json(
      {
        error: 'Churn prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
