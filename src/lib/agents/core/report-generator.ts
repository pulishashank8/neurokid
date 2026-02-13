/**
 * Report Generator
 *
 * Generates structured executive reports from reasoning sessions.
 * Transforms raw reasoning data into formatted business intelligence.
 */

import { GroqLLMClient } from './groq-client';
import type {
  ExecutiveReport,
  ReasoningSession,
  MetricValue,
  TrendAnalysis,
  RiskAssessment,
  RootCause,
  Recommendation,
  ThoughtStep,
  AgentType,
} from './types';

export class ReportGenerator {
  private llmClient: GroqLLMClient;

  constructor(llmClient: GroqLLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Generate a full executive report from a reasoning session
   */
  async generate(
    session: ReasoningSession,
    collectedData: Record<string, unknown>
  ): Promise<ExecutiveReport> {
    const startTime = Date.now();

    // Format reasoning trace
    const reasoningTrace = this.formatReasoningTrace(session.steps);

    // Use LLM to generate structured report
    const reportJson = await this.llmClient.generateStructuredReport(
      session.agentType,
      reasoningTrace,
      collectedData
    );

    // Parse LLM response
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(reportJson);
    } catch {
      parsed = {};
    }

    // Extract and validate each section
    const keyMetrics = this.extractMetrics(parsed.keyMetrics, collectedData);
    const trendAnalysis = this.extractTrends(parsed.trendAnalysis);
    const detectedRisks = this.extractRisks(parsed.detectedRisks);
    const rootCauses = this.extractRootCauses(parsed.rootCauses);
    const recommendations = this.extractRecommendations(parsed.recommendations);

    // Calculate confidence
    const confidenceScore = this.calculateConfidence(session, collectedData, parsed);
    const confidenceFactors = this.getConfidenceFactors(session, collectedData);

    // Get tools used
    const toolsUsed = this.extractToolsUsed(session.steps);
    const dataSourcesQueried = Object.keys(collectedData);

    return {
      agentType: session.agentType,
      generatedAt: new Date(),
      sessionId: session.id,

      executiveSummary: this.cleanString(parsed.executiveSummary) ||
        session.finalConclusion ||
        'Analysis completed.',

      keyMetrics,
      trendAnalysis,
      detectedRisks,
      rootCauses,
      recommendations,

      confidenceScore,
      confidenceFactors,
      reasoningSteps: session.currentStep,
      toolsUsed,
      dataSourcesQueried,
      executionTimeMs: Date.now() - startTime,

      reasoningTrace: session.steps,
    };
  }

  /**
   * Format reasoning steps as a trace string
   */
  private formatReasoningTrace(steps: ThoughtStep[]): string {
    return steps.map((step, i) => {
      let text = `Step ${i + 1}: ${step.thought}`;
      if (step.action) {
        text += `\n  Action: ${step.action.tool}(${JSON.stringify(step.action.input)})`;
        text += `\n  Reasoning: ${step.action.reasoning}`;
      }
      if (step.observation) {
        text += `\n  Observation: ${step.observation}`;
      }
      text += `\n  Confidence: ${(step.confidence * 100).toFixed(0)}%`;
      return text;
    }).join('\n\n');
  }

  /**
   * Extract and validate metrics from LLM output
   */
  private extractMetrics(
    llmMetrics: unknown,
    collectedData: Record<string, unknown>
  ): MetricValue[] {
    const metrics: MetricValue[] = [];

    if (Array.isArray(llmMetrics)) {
      for (const m of llmMetrics) {
        if (typeof m === 'object' && m !== null) {
          const metric = m as Record<string, unknown>;
          metrics.push({
            name: this.cleanString(metric.name) || 'Unknown Metric',
            value: this.toNumber(metric.value),
            unit: this.cleanString(metric.unit),
            change: this.toNumber(metric.change),
            changeDirection: this.validateDirection(metric.changeDirection),
            period: this.cleanString(metric.period),
            benchmark: this.toNumber(metric.benchmark),
          });
        }
      }
    }

    // Extract additional metrics from collected data if LLM missed them
    if (metrics.length < 3) {
      const additionalMetrics = this.extractMetricsFromData(collectedData);
      for (const m of additionalMetrics) {
        if (!metrics.some(existing => existing.name === m.name)) {
          metrics.push(m);
        }
      }
    }

    return metrics.slice(0, 10); // Limit to 10 metrics
  }

  /**
   * Extract metrics directly from collected data
   */
  private extractMetricsFromData(data: Record<string, unknown>): MetricValue[] {
    const metrics: MetricValue[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        for (const [subKey, subValue] of Object.entries(obj)) {
          if (typeof subValue === 'number') {
            metrics.push({
              name: this.formatMetricName(subKey),
              value: subValue,
              changeDirection: 'stable',
            });
          }
        }
      } else if (typeof value === 'number') {
        metrics.push({
          name: this.formatMetricName(key),
          value,
          changeDirection: 'stable',
        });
      }
    }

    return metrics.slice(0, 5);
  }

  /**
   * Format metric name from camelCase/snake_case
   */
  private formatMetricName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract trend analysis from LLM output
   */
  private extractTrends(llmTrends: unknown): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];

    if (Array.isArray(llmTrends)) {
      for (const t of llmTrends) {
        if (typeof t === 'object' && t !== null) {
          const trend = t as Record<string, unknown>;
          trends.push({
            metric: this.cleanString(trend.metric) || 'Unknown',
            direction: this.validateTrendDirection(trend.direction),
            magnitude: this.validateMagnitude(trend.magnitude),
            description: this.cleanString(trend.description) || '',
            dataPoints: Array.isArray(trend.dataPoints) ? trend.dataPoints as number[] : undefined,
          });
        }
      }
    }

    return trends.slice(0, 5);
  }

  /**
   * Extract risk assessments from LLM output
   */
  private extractRisks(llmRisks: unknown): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    if (Array.isArray(llmRisks)) {
      for (const r of llmRisks) {
        if (typeof r === 'object' && r !== null) {
          const risk = r as Record<string, unknown>;
          risks.push({
            riskType: this.cleanString(risk.riskType) || 'Unknown Risk',
            severity: this.validateSeverity(risk.severity),
            probability: Math.min(Math.max(this.toNumber(risk.probability), 0), 1),
            impact: this.cleanString(risk.impact) || '',
            mitigation: this.cleanString(risk.mitigation),
          });
        }
      }
    }

    return risks.slice(0, 5);
  }

  /**
   * Extract root causes from LLM output
   */
  private extractRootCauses(llmCauses: unknown): RootCause[] {
    const causes: RootCause[] = [];

    if (Array.isArray(llmCauses)) {
      for (const c of llmCauses) {
        if (typeof c === 'object' && c !== null) {
          const cause = c as Record<string, unknown>;
          causes.push({
            issue: this.cleanString(cause.issue) || '',
            cause: this.cleanString(cause.cause) || '',
            evidence: Array.isArray(cause.evidence)
              ? cause.evidence.map(e => String(e))
              : [],
            confidence: Math.min(Math.max(this.toNumber(cause.confidence), 0), 1),
          });
        }
      }
    }

    return causes.slice(0, 5);
  }

  /**
   * Extract recommendations from LLM output
   */
  private extractRecommendations(llmRecs: unknown): Recommendation[] {
    const recs: Recommendation[] = [];

    if (Array.isArray(llmRecs)) {
      for (const r of llmRecs) {
        if (typeof r === 'object' && r !== null) {
          const rec = r as Record<string, unknown>;
          recs.push({
            action: this.cleanString(rec.action) || '',
            priority: this.validatePriority(rec.priority),
            expectedImpact: this.cleanString(rec.expectedImpact) || '',
            effort: this.validateEffort(rec.effort),
            timeframe: this.cleanString(rec.timeframe),
          });
        }
      }
    }

    return recs.slice(0, 5);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    session: ReasoningSession,
    collectedData: Record<string, unknown>,
    llmParsed: Record<string, unknown>
  ): number {
    let score = 0;

    // Data completeness (30%)
    const dataPoints = Object.keys(collectedData).length;
    score += Math.min(dataPoints / 5, 1) * 0.3;

    // Reasoning depth (25%)
    const steps = session.currentStep;
    score += Math.min(steps / 5, 1) * 0.25;

    // LLM output quality (25%)
    const hasAllSections = ['executiveSummary', 'keyMetrics', 'recommendations']
      .every(k => k in llmParsed);
    score += hasAllSections ? 0.25 : 0.1;

    // Session completion (20%)
    score += session.status === 'completed' ? 0.2 : 0.05;

    return Math.min(score, 1);
  }

  /**
   * Get factors explaining confidence level
   */
  private getConfidenceFactors(
    session: ReasoningSession,
    collectedData: Record<string, unknown>
  ): string[] {
    const factors: string[] = [];

    const dataPoints = Object.keys(collectedData).length;
    if (dataPoints >= 5) {
      factors.push(`Comprehensive data collection (${dataPoints} sources)`);
    } else if (dataPoints >= 3) {
      factors.push(`Adequate data collection (${dataPoints} sources)`);
    } else {
      factors.push(`Limited data collection (${dataPoints} sources)`);
    }

    if (session.currentStep >= 5) {
      factors.push(`Deep analysis (${session.currentStep} reasoning steps)`);
    } else {
      factors.push(`Quick analysis (${session.currentStep} reasoning steps)`);
    }

    if (session.status === 'completed') {
      factors.push('Analysis completed successfully');
    } else {
      factors.push(`Analysis status: ${session.status}`);
    }

    if (session.finalConfidence && session.finalConfidence > 0.7) {
      factors.push('High model confidence in conclusions');
    }

    return factors;
  }

  /**
   * Extract tools used from reasoning steps
   */
  private extractToolsUsed(steps: ThoughtStep[]): string[] {
    const tools = new Set<string>();
    for (const step of steps) {
      if (step.action?.tool) {
        tools.add(step.action.tool);
      }
    }
    return Array.from(tools);
  }

  // ============================================================
  // VALIDATION HELPERS
  // ============================================================

  private cleanString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return undefined;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private validateDirection(value: unknown): MetricValue['changeDirection'] {
    if (value === 'up' || value === 'down' || value === 'stable') {
      return value;
    }
    return 'stable';
  }

  private validateTrendDirection(value: unknown): TrendAnalysis['direction'] {
    const valid = ['increasing', 'decreasing', 'stable', 'volatile'];
    if (typeof value === 'string' && valid.includes(value)) {
      return value as TrendAnalysis['direction'];
    }
    return 'stable';
  }

  private validateMagnitude(value: unknown): TrendAnalysis['magnitude'] {
    const valid = ['significant', 'moderate', 'minor'];
    if (typeof value === 'string' && valid.includes(value)) {
      return value as TrendAnalysis['magnitude'];
    }
    return 'moderate';
  }

  private validateSeverity(value: unknown): RiskAssessment['severity'] {
    const valid = ['low', 'medium', 'high', 'critical'];
    if (typeof value === 'string' && valid.includes(value)) {
      return value as RiskAssessment['severity'];
    }
    return 'medium';
  }

  private validatePriority(value: unknown): Recommendation['priority'] {
    const valid = ['low', 'medium', 'high', 'critical'];
    if (typeof value === 'string' && valid.includes(value)) {
      return value as Recommendation['priority'];
    }
    return 'medium';
  }

  private validateEffort(value: unknown): Recommendation['effort'] {
    const valid = ['low', 'medium', 'high'];
    if (typeof value === 'string' && valid.includes(value)) {
      return value as Recommendation['effort'];
    }
    return 'medium';
  }
}

/**
 * Create a report generator
 */
export function createReportGenerator(llmClient: GroqLLMClient): ReportGenerator {
  return new ReportGenerator(llmClient);
}
