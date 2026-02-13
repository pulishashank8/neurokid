/**
 * Owner Decision Support - AI Business Advisor
 * Generates weekly summaries: growth, engagement, risk, AI status, recommended actions
 */
import { getKpis } from './kpis';
import { generateAIWeeklySummary } from './ai-summary';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export interface AdvisorSummary {
  growthHealth: string;
  engagementInsight: string;
  riskAlerts: string[];
  aiStatus: string;
  recommendedActions: string[];
}

export async function getDecisionSupportSummary(): Promise<AdvisorSummary> {
  const [kpis, aiSummary, unresolvedAnomalies, churnRisk, dataQuality] = await Promise.all([
    getKpis(),
    generateAIWeeklySummary(),
    prisma.systemAnomaly.findMany({
      where: { resolvedAt: null, severity: { in: ['critical', 'warning'] } },
      take: 5,
    }),
    prisma.churnPrediction.count({ where: { riskLevel: 'high' } }),
    prisma.dataQualityMetric.findFirst({
      where: { metricName: 'missing_profile_pct' },
      orderBy: { recordedAt: 'desc' },
    }),
  ]);

  const changes = kpis.changes as Record<string, number>;
  const growthHealth =
    (changes.activeUsers7d ?? 0) > 5
      ? 'Growth healthy: active users trending up.'
      : (changes.activeUsers7d ?? 0) < -10
        ? 'Growth declining: consider re-engagement campaigns.'
        : 'Growth stable.';

  const engagementInsight =
    (changes.totalPosts ?? 0) > 10
      ? 'Community engagement improved.'
      : (changes.totalMessages ?? 0) > 15
        ? 'Messaging activity increased.'
        : 'Engagement within normal range.';

  const riskAlerts: string[] = [];
  if (unresolvedAnomalies.length > 0) {
    riskAlerts.push(`${unresolvedAnomalies.length} unresolved system anomalies.`);
  }
  if (churnRisk > 10) {
    riskAlerts.push(`${churnRisk} users at high churn risk.`);
  }
  const missingPct = dataQuality?.metricValue ?? 0;
  if (missingPct > 10) {
    riskAlerts.push(`${missingPct}% of users missing profiles.`);
  }
  if (riskAlerts.length === 0) {
    riskAlerts.push('No critical risks detected.');
  }

  const recommendedActions: string[] = [];
  if ((changes.activeUsers7d ?? 0) < -10) {
    recommendedActions.push('Improve onboarding to boost retention.');
  }
  if (unresolvedAnomalies.length > 0) {
    recommendedActions.push('Review and resolve system anomalies.');
  }
  if (churnRisk > 5) {
    recommendedActions.push('Consider re-engagement campaign for at-risk users.');
  }
  if ((changes.totalPosts ?? 0) < -20) {
    recommendedActions.push('Engagement dropped among new parents. Consider improving onboarding.');
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('No urgent actions. Continue monitoring.');
  }

  return {
    growthHealth,
    engagementInsight,
    riskAlerts,
    aiStatus: aiSummary,
    recommendedActions,
  };
}
