/**
 * Owner Advisor - AI-Driven via Reasoning Engine
 *
 * Replaces deterministic getDecisionSupportSummary with agent execution.
 * Uses BUSINESS_ANALYST agent to gather data and synthesize advisor summary.
 */

import { runAgentWithGoal } from '@/lib/agents';
import { logAIUsage, estimateAgentTokens } from '@/lib/ai/usage-logger';
import type { AdvisorSummary } from './decision-support';

const ADVISOR_GOAL = `Generate an executive advisor summary for the Owner Dashboard. 
Synthesize: (1) Growth health - are active users and signups trending? (2) Engagement insight - community activity level.
(3) Risk alerts - anomalies, churn risk, data quality issues. (4) AI status - usage, failure rate, response times.
(5) Recommended actions - prioritized by impact. Use tools to gather current metrics, then provide concise actionable summary.`;

/**
 * Get advisor summary via AI agent reasoning engine
 */
export async function getAdvisorSummaryViaAgent(): Promise<AdvisorSummary> {
  const result = await runAgentWithGoal('BUSINESS_ANALYST', ADVISOR_GOAL, [
    'Provide specific metrics',
    'Prioritize risks by severity',
    'Keep recommendations actionable',
  ]);

  if (!result.success || !result.report) {
    logAIUsage({
      feature: 'advisor',
      tokensUsed: estimateAgentTokens(result.session?.currentStep ?? 0),
      status: 'failed',
    }).catch(() => {});
    return { ...getFallbackSummary(result.error), isFallback: true };
  }

  // Log AI usage for dashboard aggregation
  const steps = result.report.reasoningSteps ?? result.session?.currentStep ?? 0;
  logAIUsage({
    feature: 'advisor',
    tokensUsed: estimateAgentTokens(steps),
    responseTimeMs: result.report.executionTimeMs ?? undefined,
    status: 'success',
  }).catch(() => {});

  const r = result.report;

  const growthMetric = r.keyMetrics?.find(
    (m) => m.name.toLowerCase().includes('active') || m.name.toLowerCase().includes('growth')
  );
  let growthHealth = 'Growth metrics analyzed.';
  if (r.executiveSummary) {
    growthHealth = r.executiveSummary.slice(0, 200);
  } else if (growthMetric) {
    growthHealth = `Growth: ${growthMetric.value}${growthMetric.unit ?? ''}`;
  }

  const engagementTrend = r.trendAnalysis?.find(
    (t) => t.metric.toLowerCase().includes('engagement') || t.metric.toLowerCase().includes('post')
  );
  const engagementInsight = engagementTrend?.description ?? r.executiveSummary?.slice(100, 300) ?? 'Engagement analyzed.';

  const riskAlerts = r.detectedRisks?.map((risk) => `${risk.riskType}: ${risk.impact}`) ?? [];
  if (riskAlerts.length === 0 && r.recommendations?.some((rec) => rec.priority === 'high' || rec.priority === 'critical')) {
    riskAlerts.push('High-priority items require attention.');
  }
  if (riskAlerts.length === 0) {
    riskAlerts.push('No critical risks detected.');
  }

  const aiMetric = r.keyMetrics?.find(
    (m) => m.name.toLowerCase().includes('ai') || m.name.toLowerCase().includes('request')
  );
  const aiStatus = aiMetric
    ? `AI: ${aiMetric.value}${aiMetric.unit ?? ''} requests`
    : r.executiveSummary?.slice(0, 150) ?? 'AI status reviewed.';

  const recommendedActions =
    r.recommendations?.map((rec) => rec.action) ?? [];
  if (recommendedActions.length === 0) {
    recommendedActions.push('No urgent actions. Continue monitoring.');
  }

  return {
    growthHealth,
    engagementInsight,
    riskAlerts,
    aiStatus,
    recommendedActions,
    isFallback: false,
  };
}

function getFallbackSummary(error?: string): AdvisorSummary {
  return {
    growthHealth: 'Unable to analyze. ' + (error ?? 'Agent did not complete.'),
    engagementInsight: 'Check dashboard metrics manually.',
    riskAlerts: ['Advisor analysis failed. Review logs.'],
    aiStatus: 'Status unknown.',
    recommendedActions: ['Retry advisor or check agent configuration.'],
  };
}
