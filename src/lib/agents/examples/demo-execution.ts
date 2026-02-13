/**
 * AI Agent Demo Execution
 *
 * This file demonstrates the TRUE AI Agent architecture in action.
 * Shows internal reasoning, tool selection, observation, and report generation.
 *
 * Run with: npx tsx src/lib/agents/examples/demo-execution.ts
 */

import { runAgent, getAgentConfig, formatReportForAPI } from '../index';
import type { AgentType, ExecutiveReport, ThoughtStep } from '../core/types';

// ============================================================
// DEMONSTRATION UTILITIES
// ============================================================

function printHeader(title: string): void {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

function printSection(title: string): void {
  console.log('\n' + '-'.repeat(50));
  console.log(`  ${title}`);
  console.log('-'.repeat(50));
}

function printReasoningTrace(steps: ThoughtStep[]): void {
  printSection('REASONING TRACE (ReAct Loop)');

  for (const step of steps) {
    console.log(`\n[Step ${step.step}] Confidence: ${(step.confidence * 100).toFixed(0)}%`);
    console.log(`  THOUGHT: ${step.thought.slice(0, 200)}${step.thought.length > 200 ? '...' : ''}`);

    if (step.action) {
      console.log(`  ACTION: Call tool "${step.action.tool}"`);
      console.log(`    Input: ${JSON.stringify(step.action.input).slice(0, 100)}`);
      console.log(`    Reasoning: ${step.action.reasoning.slice(0, 100)}`);
    }

    if (step.observation) {
      console.log(`  OBSERVATION: ${step.observation.slice(0, 150)}${step.observation.length > 150 ? '...' : ''}`);
    }

    console.log(`  Continue: ${step.shouldContinue ? 'Yes' : 'No (concluded)'}`);
  }
}

function printReport(report: ExecutiveReport): void {
  printSection('EXECUTIVE REPORT');

  console.log(`\nAgent: ${report.agentType}`);
  console.log(`Session ID: ${report.sessionId}`);
  console.log(`Generated: ${report.generatedAt.toISOString()}`);
  console.log(`Execution Time: ${report.executionTimeMs}ms`);

  console.log('\n--- Executive Summary ---');
  console.log(report.executiveSummary);

  console.log('\n--- Key Metrics ---');
  for (const metric of report.keyMetrics.slice(0, 5)) {
    const change = metric.change
      ? ` (${metric.changeDirection === 'up' ? '+' : metric.changeDirection === 'down' ? '-' : ''}${metric.change.toFixed(1)}%)`
      : '';
    console.log(`  ${metric.name}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}${change}`);
  }

  console.log('\n--- Trend Analysis ---');
  for (const trend of report.trendAnalysis.slice(0, 3)) {
    console.log(`  ${trend.metric}: ${trend.direction} (${trend.magnitude})`);
    console.log(`    ${trend.description}`);
  }

  console.log('\n--- Detected Risks ---');
  if (report.detectedRisks.length === 0) {
    console.log('  No significant risks detected');
  } else {
    for (const risk of report.detectedRisks.slice(0, 3)) {
      console.log(`  [${risk.severity.toUpperCase()}] ${risk.riskType}`);
      console.log(`    Impact: ${risk.impact}`);
      if (risk.mitigation) {
        console.log(`    Mitigation: ${risk.mitigation}`);
      }
    }
  }

  console.log('\n--- Root Causes ---');
  if (report.rootCauses.length === 0) {
    console.log('  No root causes identified');
  } else {
    for (const cause of report.rootCauses.slice(0, 3)) {
      console.log(`  Issue: ${cause.issue}`);
      console.log(`    Cause: ${cause.cause}`);
      console.log(`    Confidence: ${(cause.confidence * 100).toFixed(0)}%`);
    }
  }

  console.log('\n--- Recommendations ---');
  for (const rec of report.recommendations.slice(0, 5)) {
    console.log(`  [${rec.priority.toUpperCase()}] ${rec.action}`);
    console.log(`    Impact: ${rec.expectedImpact}`);
    console.log(`    Effort: ${rec.effort}${rec.timeframe ? ` | Timeline: ${rec.timeframe}` : ''}`);
  }

  printSection('CONFIDENCE ANALYSIS');
  console.log(`\nOverall Confidence: ${(report.confidenceScore * 100).toFixed(0)}%`);
  console.log('Factors:');
  for (const factor of report.confidenceFactors) {
    console.log(`  - ${factor}`);
  }
  console.log(`\nReasoning Steps: ${report.reasoningSteps}`);
  console.log(`Tools Used: ${report.toolsUsed.join(', ')}`);
  console.log(`Data Sources: ${report.dataSourcesQueried.join(', ')}`);
}

// ============================================================
// DEMO EXECUTION
// ============================================================

async function runDemoAgent(agentType: AgentType): Promise<void> {
  const config = getAgentConfig(agentType);
  if (!config) {
    console.error(`Unknown agent type: ${agentType}`);
    return;
  }

  printHeader(`RUNNING ${config.name.toUpperCase()}`);

  console.log(`\nDescription: ${config.description}`);
  console.log(`Available Tools: ${config.availableTools.join(', ')}`);
  console.log(`Max Reasoning Steps: ${config.maxReasoningSteps}`);
  console.log(`Temperature: ${config.temperature}`);

  console.log('\nStarting agent execution...\n');

  const startTime = Date.now();
  const result = await runAgent(agentType);
  const duration = Date.now() - startTime;

  console.log(`\nExecution completed in ${duration}ms`);
  console.log(`Status: ${result.session.status}`);
  console.log(`Success: ${result.success}`);

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  // Print reasoning trace
  if (result.session.steps && result.session.steps.length > 0) {
    printReasoningTrace(result.session.steps);
  }

  // Print report
  if (result.report) {
    printReport(result.report);
  }
}

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                      ║');
  console.log('║              TRUE AI AGENT ARCHITECTURE DEMONSTRATION                ║');
  console.log('║                                                                      ║');
  console.log('║  This demo shows AI agents with:                                     ║');
  console.log('║  - Goal-driven reasoning via Groq LLM                                ║');
  console.log('║  - ReAct loop (Think → Act → Observe → Refine)                       ║');
  console.log('║  - Dynamic tool selection                                            ║');
  console.log('║  - Short-term and long-term memory                                   ║');
  console.log('║  - Structured executive reports                                      ║');
  console.log('║  - Computed confidence scores                                        ║');
  console.log('║                                                                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // Demo 1: Growth Strategist
  await runDemoAgent('GROWTH_STRATEGIST');

  // Demo 2: Security Sentinel
  await runDemoAgent('SECURITY_SENTINEL');

  printHeader('DEMONSTRATION COMPLETE');
  console.log('\nBoth agents demonstrated:');
  console.log('  1. Goal interpretation and planning');
  console.log('  2. Multi-step reasoning with tool calls');
  console.log('  3. Observation and refinement');
  console.log('  4. Structured report generation');
  console.log('  5. Computed confidence scores\n');
}

// Run if executed directly
main().catch(console.error);
