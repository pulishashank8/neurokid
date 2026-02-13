/**
 * Pipeline Tools
 *
 * Tools that run deterministic data pipelines (anomaly scan, churn computation)
 * so AI agents can trigger them as part of their reasoning and then analyze results.
 * Enables autonomous agent-driven execution per requirement 7.
 */

import { prisma } from '@/lib/prisma';
import { subMinutes, subHours, subDays } from 'date-fns';
import { createAdminNotification } from '@/lib/owner/create-admin-notification';
import { createTool } from '../core/tool-registry';
import type { Tool, ToolExecutionResult } from '../core/types';

// ============================================================
// RUN ANOMALY SCAN
// ============================================================

interface AnomalyScanInput {
  windowMinutes?: number;
}

interface AnomalyScanOutput {
  anomaliesDetected: number;
  anomalies: Array<{
    anomalyType: string;
    description: string;
    severity: string;
    metadata?: Record<string, unknown>;
  }>;
  scanWindow: string;
  notificationsCreated: number;
}

export const runAnomalyScanTool: Tool<AnomalyScanInput, AnomalyScanOutput> = createTool(
  {
    name: 'run_anomaly_scan',
    description: 'Run the deterministic anomaly detection pipeline. Scans for active user drops, report spikes, AI failure surge, messaging spikes, and DB latency. Use before analyzing anomalies.',
    category: 'system',
    parameters: [
      {
        name: 'windowMinutes',
        type: 'number',
        description: 'Analysis window in minutes (default: 5 for recent, 15 for metrics)',
        required: false,
        default: 5,
      },
    ],
    returns: {
      type: 'object',
      description: 'Anomalies detected and persisted',
    },
  },
  async (input): Promise<ToolExecutionResult<AnomalyScanOutput>> => {
    try {
      const now = new Date();
      const last24h = subHours(now, 24);
      const prev24h = subHours(last24h, 24);
      const fiveMinAgo = subMinutes(now, 5);
      const prevFiveMin = subMinutes(fiveMinAgo, 5);

      const [
        activeUsersLast24h,
        activeUsersPrev24h,
        reportCountLast5m,
        reportCountPrev5m,
        messageReportCountLast5m,
        messageReportCountPrev5m,
        aiFailuresLast5m,
        aiFailuresPrev5m,
        messageCountLast5m,
        messageCountPrev5m,
        recentMetrics,
      ] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: last24h } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: prev24h, lt: last24h } } }),
        prisma.report.count({ where: { createdAt: { gte: fiveMinAgo } } }),
        prisma.report.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
        prisma.messageReport.count({ where: { createdAt: { gte: fiveMinAgo } } }),
        prisma.messageReport.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
        prisma.aIJob.count({ where: { status: 'failed', completedAt: { gte: fiveMinAgo } } }),
        prisma.aIJob.count({ where: { status: 'failed', completedAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
        prisma.message.count({ where: { createdAt: { gte: fiveMinAgo } } }),
        prisma.message.count({ where: { createdAt: { gte: prevFiveMin, lt: fiveMinAgo } } }),
        prisma.systemMetric.findMany({
          where: { recordedAt: { gte: subMinutes(now, 15) } },
          orderBy: { recordedAt: 'desc' },
          take: 50,
        }),
      ]);

      const anomalies: AnomalyScanOutput['anomalies'] = [];
      const THRESHOLD_ACTIVE_USERS_DROP = 0.3;
      const THRESHOLD_REPORT_SPIKE = 3;
      const THRESHOLD_AI_FAILURE_SPIKE = 5;
      const THRESHOLD_MESSAGING_SPIKE = 3;

      if (activeUsersPrev24h > 10 && activeUsersLast24h < activeUsersPrev24h * (1 - THRESHOLD_ACTIVE_USERS_DROP)) {
        const pct = Math.round(((activeUsersPrev24h - activeUsersLast24h) / activeUsersPrev24h) * 100);
        anomalies.push({
          anomalyType: 'active_users_drop',
          description: `Active users dropped ${pct}% vs previous 24h (${activeUsersLast24h} vs ${activeUsersPrev24h})`,
          severity: 'critical',
          metadata: { last24h: activeUsersLast24h, prev24h: activeUsersPrev24h, pct },
        });
      }

      const totalReportsLast = reportCountLast5m + messageReportCountLast5m;
      const totalReportsPrev = reportCountPrev5m + messageReportCountPrev5m;
      if (totalReportsPrev > 0 && totalReportsLast >= totalReportsPrev * THRESHOLD_REPORT_SPIKE) {
        anomalies.push({
          anomalyType: 'report_spike',
          description: `Reports spiked to ${totalReportsLast} in 5 min (prev: ${totalReportsPrev})`,
          severity: totalReportsLast > 20 ? 'critical' : 'warning',
          metadata: { last5m: totalReportsLast, prev5m: totalReportsPrev },
        });
      } else if (totalReportsPrev === 0 && totalReportsLast > 15) {
        anomalies.push({
          anomalyType: 'report_spike',
          description: `Sudden surge: ${totalReportsLast} reports in 5 min`,
          severity: 'warning',
          metadata: { last5m: totalReportsLast },
        });
      }

      const aiBaseline = Math.max(aiFailuresPrev5m, 1);
      if (aiFailuresLast5m >= aiBaseline * THRESHOLD_AI_FAILURE_SPIKE) {
        anomalies.push({
          anomalyType: 'ai_failure_surge',
          description: `AI failures spiked: ${aiFailuresLast5m} in 5 min (prev: ${aiFailuresPrev5m})`,
          severity: aiFailuresLast5m > 10 ? 'critical' : 'warning',
          metadata: { last5m: aiFailuresLast5m, prev5m: aiFailuresPrev5m },
        });
      }

      const msgBaseline = Math.max(messageCountPrev5m, 1);
      if (messageCountLast5m >= msgBaseline * THRESHOLD_MESSAGING_SPIKE && messageCountLast5m > 30) {
        anomalies.push({
          anomalyType: 'messaging_spike',
          description: `Messaging spike: ${messageCountLast5m} messages in 5 min - possible spam`,
          severity: messageCountLast5m > 100 ? 'critical' : 'warning',
          metadata: { last5m: messageCountLast5m, prev5m: messageCountPrev5m },
        });
      }

      const dbLatencies = recentMetrics
        .filter((m) => m.metricName === 'db_latency_ms')
        .map((m) => m.metricValue);
      const avgDbLatency = dbLatencies.length > 0
        ? dbLatencies.reduce((a, b) => a + b, 0) / dbLatencies.length
        : 0;
      if (avgDbLatency > 2000) {
        anomalies.push({
          anomalyType: 'error_rate_spike',
          description: `DB latency elevated: avg ${Math.round(avgDbLatency)}ms over last 15 min`,
          severity: 'critical',
          metadata: { avgDbLatencyMs: avgDbLatency },
        });
      }

      let notificationsCreated = 0;
      for (const a of anomalies) {
        await prisma.systemAnomaly.create({
          data: {
            anomalyType: a.anomalyType,
            description: a.description,
            severity: a.severity,
            metadata: a.metadata ? (a.metadata as object) : undefined,
          },
        });
        await createAdminNotification({
          type: 'anomaly',
          severity: a.severity as 'info' | 'warning' | 'critical',
          message: `[Anomaly] ${a.description}`,
          relatedEntity: a.anomalyType,
          metadata: a.metadata,
        });
        notificationsCreated++;
      }

      return {
        success: true,
        data: {
          anomaliesDetected: anomalies.length,
          anomalies,
          scanWindow: '5m/24h',
          notificationsCreated,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Anomaly scan failed',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// COMPUTE CHURN SCORES
// ============================================================

interface ChurnComputeInput {
  pruneDays?: number;
}

interface ChurnComputeOutput {
  usersScored: number;
  highRiskCount: number;
  mediumRiskCount: number;
  atRiskTotal: number;
  averageChurnProbability: number;
  prunedCount: number;
}

export const computeChurnScoresTool: Tool<ChurnComputeInput, ChurnComputeOutput> = createTool(
  {
    name: 'compute_churn_scores',
    description: 'Run the churn prediction pipeline. Scores users by inactivity, feature usage, and engagement decay. Populates ChurnPrediction table for analysis.',
    category: 'analytics',
    parameters: [
      {
        name: 'pruneDays',
        type: 'number',
        description: 'Days to keep predictions before pruning (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'Churn computation summary',
    },
  },
  async (input): Promise<ToolExecutionResult<ChurnComputeOutput>> => {
    try {
      const now = new Date();
      const fourteenDaysAgo = subDays(now, 14);

      const users = await prisma.user.findMany({
        where: { isBanned: false },
        select: { id: true, lastLoginAt: true, lastActiveAt: true, createdAt: true },
      });

      const eventCounts = await prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { userId: { not: null }, createdAt: { gte: fourteenDaysAgo } },
        _count: { id: true },
      });
      const eventMap = new Map(eventCounts.map((e) => [e.userId!, e._count.id]));

      const predictions: Array<{ userId: string; churnProbability: number; riskLevel: string }> = [];

      for (const user of users) {
        const lastActive = user.lastActiveAt ?? user.lastLoginAt ?? user.createdAt;
        const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        const eventsLast14d = eventMap.get(user.id) ?? 0;

        let score = 0;

        if (daysSinceActive >= 14) score += 0.4;
        else if (daysSinceActive >= 7) score += 0.2;

        if (eventsLast14d === 0 && daysSinceActive < 14) score += 0.2;
        if (daysSinceActive >= 30) score += 0.3;

        const daysSinceSignup = (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup < 7 && eventsLast14d === 0) score += 0.15;

        const churnProbability = Math.min(score, 1);
        let riskLevel = 'low';
        if (churnProbability >= 0.6) riskLevel = 'high';
        else if (churnProbability >= 0.3) riskLevel = 'medium';

        if (churnProbability >= 0.2) {
          predictions.push({ userId: user.id, churnProbability, riskLevel });
        }
      }

      if (predictions.length > 0) {
        await prisma.churnPrediction.createMany({
          data: predictions.map((p) => ({
            userId: p.userId,
            churnProbability: p.churnProbability,
            riskLevel: p.riskLevel,
          })),
        });
      }

      const pruneDays = input.pruneDays ?? 7;
      const sevenDaysAgoPrune = subDays(now, pruneDays);
      const pruned = await prisma.churnPrediction.deleteMany({
        where: { predictedAt: { lt: sevenDaysAgoPrune } },
      });

      const highRisk = predictions.filter((p) => p.riskLevel === 'high').length;
      const mediumRisk = predictions.filter((p) => p.riskLevel === 'medium').length;
      const avgProb =
        predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length
          : 0;

      return {
        success: true,
        data: {
          usersScored: users.length,
          highRiskCount: highRisk,
          mediumRiskCount: mediumRisk,
          atRiskTotal: predictions.length,
          averageChurnProbability: Math.round(avgProb * 100) / 100,
          prunedCount: pruned.count,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Churn computation failed',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// RUN DATA QUALITY MONITOR
// ============================================================

interface DataQualityMonitorInput {
  staleDays?: number;
}

interface DataQualityMonitorOutput {
  metricsRecorded: number;
  missingProfilePct: number;
  staleUsersPct: number;
  duplicateRecords: number;
}

export const runDataQualityMonitorTool: Tool<DataQualityMonitorInput, DataQualityMonitorOutput> = createTool(
  {
    name: 'run_data_quality_monitor',
    description: 'Run the data quality monitoring pipeline. Records missing profiles, stale users, duplicates. Use before analyzing data quality.',
    category: 'system',
    parameters: [
      {
        name: 'staleDays',
        type: 'number',
        description: 'Days to consider user stale (default: 90)',
        required: false,
        default: 90,
      },
    ],
    returns: {
      type: 'object',
      description: 'Data quality metrics recorded',
    },
  },
  async (input): Promise<ToolExecutionResult<DataQualityMonitorOutput>> => {
    try {
      const { runDataQualityMonitor } = await import('@/lib/owner/data-quality-monitor');
      await runDataQualityMonitor();

      const ninetyDaysAgo = subDays(new Date(), input.staleDays ?? 90);
      const [totalUsers, usersWithoutProfile, staleUsers, duplicateResult] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { profile: null } }),
        prisma.user.count({
          where: {
            OR: [
              { lastActiveAt: { lt: ninetyDaysAgo } },
              { lastActiveAt: null, lastLoginAt: { lt: ninetyDaysAgo } },
              { lastActiveAt: null, lastLoginAt: null, createdAt: { lt: ninetyDaysAgo } },
            ],
          },
        }),
        prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM (SELECT email, COUNT(*) as c FROM "User" GROUP BY email HAVING COUNT(*) > 1) t`,
      ]);

      const dupCount = Number(duplicateResult[0]?.count ?? 0);
      const missingProfilePct = totalUsers > 0 ? (usersWithoutProfile / totalUsers) * 100 : 0;
      const staleUsersPct = totalUsers > 0 ? (staleUsers / totalUsers) * 100 : 0;

      return {
        success: true,
        data: {
          metricsRecorded: 5,
          missingProfilePct: Math.round(missingProfilePct * 100) / 100,
          staleUsersPct: Math.round(staleUsersPct * 100) / 100,
          duplicateRecords: dupCount,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data quality monitor failed',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// RUN ANALYTICS AGGREGATION
// ============================================================

interface AnalyticsAggregationInput {
  runRetention?: boolean;
  runLifecycle?: boolean;
  runDataQuality?: boolean;
}

interface AnalyticsAggregationOutput {
  retentionCompleted: boolean;
  lifecycleCompleted: boolean;
  dataQualityCompleted: boolean;
}

export const runAnalyticsAggregationTool: Tool<AnalyticsAggregationInput, AnalyticsAggregationOutput> = createTool(
  {
    name: 'run_analytics_aggregation',
    description: 'Run retention calculation, lifecycle calculation, and data quality monitor. Populates tables for analysis.',
    category: 'analytics',
    parameters: [
      { name: 'runRetention', type: 'boolean', description: 'Run retention calculation', required: false, default: true },
      { name: 'runLifecycle', type: 'boolean', description: 'Run lifecycle calculation', required: false, default: true },
      { name: 'runDataQuality', type: 'boolean', description: 'Run data quality monitor', required: false, default: true },
    ],
    returns: {
      type: 'object',
      description: 'Aggregation completion status',
    },
  },
  async (input): Promise<ToolExecutionResult<AnalyticsAggregationOutput>> => {
    try {
      const doRetention = input.runRetention !== false;
      const doLifecycle = input.runLifecycle !== false;
      const doDataQuality = input.runDataQuality !== false;

      if (doRetention) {
        const { runRetentionCalculation } = await import('@/lib/owner/retention');
        await runRetentionCalculation();
      }
      if (doLifecycle) {
        const { runLifecycleCalculation } = await import('@/lib/owner/lifecycle');
        await runLifecycleCalculation();
      }
      if (doDataQuality) {
        const { runDataQualityMonitor } = await import('@/lib/owner/data-quality-monitor');
        await runDataQualityMonitor();
      }

      return {
        success: true,
        data: {
          retentionCompleted: doRetention,
          lifecycleCompleted: doLifecycle,
          dataQualityCompleted: doDataQuality,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics aggregation failed',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// RUN RISK SCORING
// ============================================================

interface RiskScoringInput {
  lookbackDays?: number;
}

interface RiskScoringOutput {
  usersScored: number;
  highRiskCount: number;
  mediumRiskCount: number;
}

export const runRiskScoringTool: Tool<RiskScoringInput, RiskScoringOutput> = createTool(
  {
    name: 'run_risk_scoring',
    description: 'Run user risk scoring pipeline. Scores users by reports, content removals, rate limits.',
    category: 'security',
    parameters: [
      {
        name: 'lookbackDays',
        type: 'number',
        description: 'Days to look back for scoring (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'Risk scoring summary',
    },
  },
  async (): Promise<ToolExecutionResult<RiskScoringOutput>> => {
    try {
      const { runRiskScoring } = await import('@/lib/owner/risk-scoring');
      await runRiskScoring();

      const [total, highRisk, mediumRisk] = await Promise.all([
        prisma.userRiskScore.count(),
        prisma.userRiskScore.count({ where: { riskLevel: 'HIGH' } }),
        prisma.userRiskScore.count({ where: { riskLevel: 'MEDIUM' } }),
      ]);

      return {
        success: true,
        data: {
          usersScored: total,
          highRiskCount: highRisk,
          mediumRiskCount: mediumRisk,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Risk scoring failed',
        executionTimeMs: 0,
      };
    }
  }
);

export const pipelineTools = [
  runAnomalyScanTool,
  computeChurnScoresTool,
  runDataQualityMonitorTool,
  runAnalyticsAggregationTool,
  runRiskScoringTool,
];
