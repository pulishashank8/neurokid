/**
 * Memory Tools
 *
 * Tools for querying past insights and historical data.
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';
import { createTool } from '../core/tool-registry';
import type { Tool, ToolExecutionResult, AgentType } from '../core/types';

// ============================================================
// QUERY PAST INSIGHTS
// ============================================================

interface QueryInsightsInput {
  agentType?: string;
  category?: string;
  severity?: string;
  days?: number;
  limit?: number;
  unresolvedOnly?: boolean;
}

interface InsightRecord {
  id: string;
  agentType: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string | null;
  confidence: number;
  createdAt: string;
  isResolved: boolean;
}

interface QueryInsightsOutput {
  insights: InsightRecord[];
  totalCount: number;
  unresolvedCount: number;
  criticalCount: number;
  recurringPatterns: string[];
}

export const queryPastInsightsTool: Tool<QueryInsightsInput, QueryInsightsOutput> = createTool(
  {
    name: 'query_past_insights',
    description: 'Query historical insights from previous agent analyses. Use this to find patterns, compare with past findings, and check for recurring issues.',
    category: 'memory',
    parameters: [
      {
        name: 'agentType',
        type: 'string',
        description: 'Filter by agent type (e.g., GROWTH_STRATEGIST, SECURITY_SENTINEL)',
        required: false,
      },
      {
        name: 'category',
        type: 'string',
        description: 'Filter by category (e.g., GROWTH, RISK, SECURITY)',
        required: false,
      },
      {
        name: 'severity',
        type: 'string',
        description: 'Filter by severity (info, warning, critical)',
        required: false,
        enum: ['info', 'warning', 'critical'],
      },
      {
        name: 'days',
        type: 'number',
        description: 'Number of days to look back (default: 7)',
        required: false,
        default: 7,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of results (default: 20)',
        required: false,
        default: 20,
      },
      {
        name: 'unresolvedOnly',
        type: 'boolean',
        description: 'Only return unresolved insights',
        required: false,
        default: false,
      },
    ],
    returns: {
      type: 'object',
      description: 'Historical insights with pattern analysis',
    },
  },
  async (input): Promise<ToolExecutionResult<QueryInsightsOutput>> => {
    try {
      const days = input.days ?? 7;
      const limit = input.limit ?? 20;
      const since = subDays(new Date(), days);

      // Build where clause
      const where: Record<string, unknown> = {
        createdAt: { gte: since },
      };

      if (input.agentType) {
        where.agentType = input.agentType;
      }
      if (input.category) {
        where.category = input.category;
      }
      if (input.severity) {
        where.severity = input.severity;
      }
      if (input.unresolvedOnly) {
        where.isResolved = false;
      }

      // Get insights
      const [insights, totalCount, unresolvedCount, criticalCount] = await Promise.all([
        prisma.aIAgentInsight.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.aIAgentInsight.count({ where: { createdAt: { gte: since } } }),
        prisma.aIAgentInsight.count({ where: { createdAt: { gte: since }, isResolved: false } }),
        prisma.aIAgentInsight.count({ where: { createdAt: { gte: since }, severity: 'critical' } }),
      ]);

      // Detect recurring patterns
      const titleCounts: Record<string, number> = {};
      for (const insight of insights) {
        const normalizedTitle = insight.title.toLowerCase().replace(/\d+/g, 'N');
        titleCounts[normalizedTitle] = (titleCounts[normalizedTitle] || 0) + 1;
      }

      const recurringPatterns = Object.entries(titleCounts)
        .filter(([_, count]) => count >= 2)
        .map(([title, count]) => `"${title}" appeared ${count} times`);

      return {
        success: true,
        data: {
          insights: insights.map(i => ({
            id: i.id,
            agentType: i.agentType,
            category: i.category,
            severity: i.severity,
            title: i.title,
            description: i.description,
            recommendation: i.recommendation,
            confidence: i.confidence,
            createdAt: i.createdAt.toISOString(),
            isResolved: i.isResolved,
          })),
          totalCount,
          unresolvedCount,
          criticalCount,
          recurringPatterns,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query insights',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET ANOMALY HISTORY
// ============================================================

interface AnomalyHistoryInput {
  days?: number;
  anomalyType?: string;
}

interface AnomalyRecord {
  id: string;
  anomalyType: string;
  description: string;
  severity: string;
  detectedAt: string;
  resolvedAt: string | null;
}

interface AnomalyHistoryOutput {
  anomalies: AnomalyRecord[];
  totalCount: number;
  unresolvedCount: number;
  byType: Record<string, number>;
}

export const getAnomalyHistoryTool: Tool<AnomalyHistoryInput, AnomalyHistoryOutput> = createTool(
  {
    name: 'get_anomaly_history',
    description: 'Get historical system anomalies for pattern detection.',
    category: 'memory',
    parameters: [
      {
        name: 'days',
        type: 'number',
        description: 'Days to look back (default: 7)',
        required: false,
        default: 7,
      },
      {
        name: 'anomalyType',
        type: 'string',
        description: 'Filter by anomaly type',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      description: 'Anomaly history with type distribution',
    },
  },
  async (input): Promise<ToolExecutionResult<AnomalyHistoryOutput>> => {
    try {
      const days = input.days ?? 7;
      const since = subDays(new Date(), days);

      const where: Record<string, unknown> = {
        detectedAt: { gte: since },
      };

      if (input.anomalyType) {
        where.anomalyType = input.anomalyType;
      }

      const [anomalies, unresolvedCount] = await Promise.all([
        prisma.systemAnomaly.findMany({
          where,
          orderBy: { detectedAt: 'desc' },
          take: 50,
        }),
        prisma.systemAnomaly.count({
          where: { ...where, resolvedAt: null },
        }),
      ]);

      // Count by type
      const byType: Record<string, number> = {};
      for (const anomaly of anomalies) {
        byType[anomaly.anomalyType] = (byType[anomaly.anomalyType] || 0) + 1;
      }

      return {
        success: true,
        data: {
          anomalies: anomalies.map(a => ({
            id: a.id,
            anomalyType: a.anomalyType,
            description: a.description,
            severity: a.severity,
            detectedAt: a.detectedAt.toISOString(),
            resolvedAt: a.resolvedAt?.toISOString() ?? null,
          })),
          totalCount: anomalies.length,
          unresolvedCount,
          byType,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get anomaly history',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET METRIC BASELINES
// ============================================================

interface MetricBaselinesInput {
  metrics?: string[];
  days?: number;
}

interface MetricBaselinesOutput {
  baselines: Record<string, {
    average: number;
    min: number;
    max: number;
    stdDev: number;
  }>;
  dataPoints: number;
}

export const getMetricBaselinesTool: Tool<MetricBaselinesInput, MetricBaselinesOutput> = createTool(
  {
    name: 'get_metric_baselines',
    description: 'Get baseline values for system metrics to detect deviations.',
    category: 'memory',
    parameters: [
      {
        name: 'metrics',
        type: 'array',
        description: 'Metric names to get baselines for',
        required: false,
      },
      {
        name: 'days',
        type: 'number',
        description: 'Days of data to use for baseline (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'Baseline statistics for metrics',
    },
  },
  async (input): Promise<ToolExecutionResult<MetricBaselinesOutput>> => {
    try {
      const days = input.days ?? 7;
      const since = subDays(new Date(), days);

      const where: Record<string, unknown> = {
        recordedAt: { gte: since },
      };

      if (input.metrics && input.metrics.length > 0) {
        where.metricName = { in: input.metrics };
      }

      const metrics = await prisma.systemMetric.findMany({
        where,
        select: { metricName: true, metricValue: true },
      });

      // Group by metric and calculate statistics
      const byMetric: Record<string, number[]> = {};
      for (const m of metrics) {
        if (!byMetric[m.metricName]) {
          byMetric[m.metricName] = [];
        }
        byMetric[m.metricName].push(m.metricValue);
      }

      const baselines: Record<string, {
        average: number;
        min: number;
        max: number;
        stdDev: number;
      }> = {};

      for (const [name, values] of Object.entries(byMetric)) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        baselines[name] = { average: avg, min, max, stdDev };
      }

      return {
        success: true,
        data: {
          baselines,
          dataPoints: metrics.length,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metric baselines',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// EXPORT ALL MEMORY TOOLS
// ============================================================

export const memoryTools = [
  queryPastInsightsTool,
  getAnomalyHistoryTool,
  getMetricBaselinesTool,
];
