/**
 * Risk Scoring Cron
 * Run nightly via Vercel Cron
 *
 * MANDATORY: Passes through reasoning engine (requirement 7).
 * Invokes SECURITY_SENTINEL agent which:
 * - Calls run_risk_scoring tool
 * - May call get_banned_users, get_activity_anomalies, query_past_insights
 * - Generates structured security report with computed confidence
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runAgentWithGoal, formatReportForAPI } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';

const RISK_SCORING_GOAL = `Run user risk scoring and assess platform security.
Call run_risk_scoring to compute user risk scores, then analyze high-risk users and threats.
Report on security posture and recommended actions.`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAgentWithGoal('SECURITY_SENTINEL', RISK_SCORING_GOAL);

    logAIUsage({
      feature: 'ai_agent_SECURITY_SENTINEL',
      tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
      responseTimeMs: result.report?.executionTimeMs ?? undefined,
      status: result.success ? 'success' : 'failed',
    }).catch(() => {});

    return NextResponse.json({
      ok: result.success,
      message: result.success ? 'Risk analysis completed via AI agent' : result.error,
      agentType: 'SECURITY_SENTINEL',
      report: result.report ? formatReportForAPI(result.report) : null,
    });
  } catch (error) {
    console.error('[Cron] Risk scoring (AI agent) failed:', error);
    return NextResponse.json(
      {
        error: 'Risk scoring failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
