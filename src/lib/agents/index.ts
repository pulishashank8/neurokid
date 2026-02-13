/**
 * AI Agents Module
 *
 * Main entry point for the AI Agent architecture.
 * Provides agent execution, management, and tools.
 */

// Initialize tools on module load
import { initializeTools } from './tools';

// Core exports
export * from './core';

// Tool exports
export { initializeTools, getToolsForAgent } from './tools';

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

import { getAgentController, AgentController } from './core';
import type { AgentType, AgentExecutionResult, ExecutiveReport } from './core';

/**
 * Execute a single agent with its scheduled goal
 */
export async function runAgent(agentType: AgentType): Promise<AgentExecutionResult> {
  // Ensure tools are initialized
  initializeTools();

  const controller = getAgentController();
  return controller.execute({
    agentType,
    useScheduledGoal: true,
  });
}

/**
 * Execute all enabled agents
 */
export async function runAllAgents(): Promise<Map<AgentType, AgentExecutionResult>> {
  initializeTools();
  const controller = getAgentController();
  return controller.executeAll();
}

/**
 * Execute agents by schedule
 */
export async function runAgentsBySchedule(
  schedule: '15min' | 'hourly' | '6h' | 'daily'
): Promise<Map<AgentType, AgentExecutionResult>> {
  initializeTools();
  const controller = getAgentController();
  return controller.executeBySchedule(schedule);
}

/**
 * Execute an agent with a custom goal
 */
export async function runAgentWithGoal(
  agentType: AgentType,
  goalDescription: string,
  constraints?: string[]
): Promise<AgentExecutionResult> {
  initializeTools();
  const controller = getAgentController();
  return controller.execute({
    agentType,
    goal: {
      description: goalDescription,
      constraints: constraints ?? [],
    },
  });
}

/**
 * Get an agent's configuration
 */
export function getAgentConfig(agentType: AgentType) {
  const controller = getAgentController();
  return controller.getConfig(agentType);
}

/**
 * Get all agent configurations
 */
export function getAllAgentConfigs() {
  const controller = getAgentController();
  return controller.getAllConfigs();
}

/**
 * Format a report for API response
 */
export function formatReportForAPI(report: ExecutiveReport): Record<string, unknown> {
  return {
    agentType: report.agentType,
    generatedAt: report.generatedAt.toISOString(),
    sessionId: report.sessionId,

    executiveSummary: report.executiveSummary,
    keyMetrics: report.keyMetrics,
    trendAnalysis: report.trendAnalysis,
    detectedRisks: report.detectedRisks,
    rootCauses: report.rootCauses,
    recommendations: report.recommendations,

    confidenceScore: report.confidenceScore,
    confidenceFactors: report.confidenceFactors,
    reasoningSteps: report.reasoningSteps,
    toolsUsed: report.toolsUsed,
    dataSourcesQueried: report.dataSourcesQueried,
    executionTimeMs: report.executionTimeMs,
  };
}

// ============================================================
// ORCHESTRATOR RESULT TYPES (for backward compatibility)
// ============================================================

export interface OrchestratorResult {
  success: boolean;
  results: Array<{
    agentType: AgentType;
    success: boolean;
    report?: ExecutiveReport;
    error?: string;
    executionTimeMs: number;
  }>;
  totalInsights: number;
  savedInsights: number;
  totalExecutionTimeMs: number;
  errors: string[];
}

/**
 * Run all agents and return orchestrator-style result (backward compatible)
 */
export async function runAllAgentsWithOrchestratorResult(): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const results = await runAllAgents();

  const resultsArray: OrchestratorResult['results'] = [];
  const errors: string[] = [];
  let totalInsights = 0;
  let savedInsights = 0;

  for (const [agentType, result] of results) {
    resultsArray.push({
      agentType,
      success: result.success,
      report: result.report,
      error: result.error,
      executionTimeMs: result.report?.executionTimeMs ?? 0,
    });

    if (!result.success && result.error) {
      errors.push(`${agentType}: ${result.error}`);
    }

    if (result.report) {
      // Count recommendations and risks as "insights"
      const insightCount = (result.report.recommendations?.length ?? 0) +
        (result.report.detectedRisks?.length ?? 0);
      totalInsights += insightCount;
      savedInsights += insightCount; // All insights are saved automatically
    }
  }

  return {
    success: errors.length === 0,
    results: resultsArray,
    totalInsights,
    savedInsights,
    totalExecutionTimeMs: Date.now() - startTime,
    errors,
  };
}
