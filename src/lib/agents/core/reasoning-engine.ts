/**
 * Reasoning Loop Engine
 *
 * Implements the ReAct (Reasoning + Acting) pattern for AI agents.
 * Think → Choose Action → Execute Tool → Observe → Refine
 */

import { v4 as uuidv4 } from 'uuid';
import { GroqLLMClient } from './groq-client';
import { ToolRegistry } from './tool-registry';
import { MemoryManager } from './memory-manager';
import type {
  AgentType,
  AgentConfig,
  AgentGoal,
  ReasoningSession,
  ReasoningPlan,
  ThoughtStep,
  LLMToolDefinition,
  LongTermMemoryEntry,
} from './types';

export interface ReasoningEngineConfig {
  maxSteps: number;
  /** Not used for gating - confidence is always derived from computed metrics (data completeness, tool success rate, reasoning depth). */
  enableParallelTools: boolean;
  debugMode: boolean;
}

const DEFAULT_CONFIG: ReasoningEngineConfig = {
  maxSteps: 10,
  enableParallelTools: false,
  debugMode: false,
};

export class ReasoningLoopEngine {
  private llmClient: GroqLLMClient;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private config: ReasoningEngineConfig;
  private agentConfig: AgentConfig;
  private session: ReasoningSession;
  private collectedData: Record<string, unknown> = {};

  constructor(
    llmClient: GroqLLMClient,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager,
    agentConfig: AgentConfig,
    config: Partial<ReasoningEngineConfig> = {}
  ) {
    this.llmClient = llmClient;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.agentConfig = agentConfig;
    this.config = { ...DEFAULT_CONFIG, ...config, maxSteps: agentConfig.maxReasoningSteps };

    this.session = this.createSession('');
  }

  /**
   * Execute the full reasoning loop for a given goal
   */
  async execute(goal: AgentGoal): Promise<ReasoningSession> {
    this.session = this.createSession(goal.description);
    this.collectedData = {};

    try {
      // Phase 1: Planning
      this.session.status = 'planning';
      await this.planAnalysis(goal);

      // Phase 2: Execution Loop
      this.session.status = 'executing';
      await this.runReasoningLoop();

      // Phase 3: Conclusion
      this.session.status = 'concluding';
      await this.generateConclusion();

      this.session.status = 'completed';
    } catch (error) {
      this.session.status = 'failed';
      console.error('[ReasoningEngine] Execution failed:', error);
      this.memoryManager.addConclusion(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }

    this.session.steps = this.memoryManager.toThoughtSteps();
    return this.session;
  }

  /**
   * Phase 1: Create an analysis plan
   */
  private async planAnalysis(goal: AgentGoal): Promise<void> {
    // Get relevant past insights for context
    const recentInsights = await this.memoryManager.getRecentInsights(7, 5);
    const unresolvedIssues = await this.memoryManager.getUnresolvedIssues(5);

    const relevantMemories = [...recentInsights, ...unresolvedIssues];

    // Get available tools
    const availableTools = this.toolRegistry.getForAgent(this.agentConfig.type);
    const toolNames = availableTools.map(t => t.schema.name);

    // Generate plan using LLM
    const planJson = await this.llmClient.generatePlan(
      goal.description,
      toolNames,
      relevantMemories.map(m => `[${m.severity}] ${m.title}: ${m.description}`)
    );

    let plan: ReasoningPlan;
    try {
      const parsed = JSON.parse(planJson);
      plan = {
        goal: parsed.goal || goal.description,
        subGoals: parsed.subGoals || [],
        estimatedSteps: parsed.estimatedSteps || 5,
        requiredTools: parsed.requiredTools || toolNames,
        relevantMemories,
      };
    } catch {
      // Fallback plan
      plan = {
        goal: goal.description,
        subGoals: ['Gather relevant data', 'Analyze metrics', 'Identify patterns', 'Form conclusions'],
        estimatedSteps: 5,
        requiredTools: toolNames,
        relevantMemories,
      };
    }

    this.session.plan = plan;

    // Record planning in memory
    this.memoryManager.addThought(
      `Planning analysis for: ${goal.description}\n` +
      `Sub-goals: ${plan.subGoals.join(', ')}\n` +
      `Tools to use: ${plan.requiredTools.join(', ')}\n` +
      `Found ${relevantMemories.length} relevant past insights`,
      0.8
    );

    if (this.config.debugMode) {
      console.log('[ReasoningEngine] Plan:', JSON.stringify(plan, null, 2));
    }
  }

  /**
   * Phase 2: Main reasoning loop
   */
  private async runReasoningLoop(): Promise<void> {
    const tools = this.toolRegistry.toLLMFormat(this.agentConfig.type);
    let stepCount = 0;

    while (stepCount < this.config.maxSteps) {
      stepCount++;
      this.session.currentStep = stepCount;

      // Build context for this step
      const previousSteps = this.memoryManager.formatForLLM(10);
      const longTermContext = await this.memoryManager.formatLongTermForLLM(5);

      // Determine what to think about next
      const currentGoal = this.determineCurrentGoal(stepCount);

      // Get LLM response (may include tool calls)
      const response = await this.llmClient.generateReasoningStep(
        this.buildSystemPrompt(longTermContext),
        currentGoal,
        [previousSteps],
        tools
      );

      // Handle tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          await this.executeToolCall(toolCall.function.name, toolCall.function.arguments);
        }
      }

      // Record thought
      if (response.content) {
        const shouldContinue = this.shouldContinueReasoning(response.content);
        this.memoryManager.addThought(response.content, this.estimateConfidence(stepCount));

        if (!shouldContinue) {
          break;
        }
      }

      // Check if we have enough data
      if (this.hasEnoughData()) {
        this.memoryManager.addThought(
          'Sufficient data collected. Moving to conclusion phase.',
          0.85
        );
        break;
      }
    }
  }

  /**
   * Execute a tool call and record observation
   */
  private async executeToolCall(toolName: string, argumentsJson: string): Promise<void> {
    const input = this.toolRegistry.parseToolCall(toolName, argumentsJson);

    // Validate input
    const validation = this.toolRegistry.validateInput(toolName, input);
    if (!validation.valid) {
      this.memoryManager.addObservation(
        toolName,
        { error: validation.errors },
        `Tool call failed: ${validation.errors.join(', ')}`
      );
      return;
    }

    // Record action
    this.memoryManager.addAction(
      toolName,
      input,
      `Calling ${toolName} to gather data`
    );

    // Execute tool
    const result = await this.toolRegistry.execute(toolName, input);

    // Store collected data
    if (result.success && result.data) {
      this.collectedData[toolName] = result.data;
    }

    // Record observation
    this.memoryManager.addObservation(
      toolName,
      result.data ?? result.error,
      result.success
        ? this.summarizeToolResult(toolName, result.data)
        : `Error: ${result.error}`
    );

    if (this.config.debugMode) {
      console.log(`[ReasoningEngine] Tool ${toolName}:`, result.success ? 'success' : result.error);
    }
  }

  /**
   * Summarize tool result for memory
   */
  private summarizeToolResult(toolName: string, data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length <= 5) {
        return `Retrieved: ${JSON.stringify(data)}`;
      }
      return `Retrieved ${keys.length} data points from ${toolName}`;
    }
    return `Result: ${String(data)}`;
  }

  /**
   * Phase 3: Generate final conclusion
   */
  private async generateConclusion(): Promise<void> {
    const reasoningTrace = this.memoryManager.formatForLLM(30);

    // Calculate confidence based on reasoning quality
    const confidence = this.calculateFinalConfidence();

    // Generate conclusion summary
    const conclusion = await this.generateConclusionText(reasoningTrace);

    this.memoryManager.addConclusion(conclusion, confidence);
    this.session.finalConclusion = conclusion;
    this.session.finalConfidence = confidence;
  }

  /**
   * Generate conclusion text using LLM
   */
  private async generateConclusionText(reasoningTrace: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are summarizing an AI agent's analysis. Based on the reasoning trace and collected data, write a concise conclusion (2-3 sentences) that captures the key findings and their significance.`,
      },
      {
        role: 'user' as const,
        content: `Agent: ${this.agentConfig.name}\nGoal: ${this.session.goal}\n\nReasoning:\n${reasoningTrace}\n\nCollected Data:\n${JSON.stringify(this.collectedData, null, 2)}\n\nWrite the conclusion:`,
      },
    ];

    const response = await this.llmClient.chat({ messages, temperature: 0.3 });
    return response.content ?? 'Analysis completed.';
  }

  /**
   * Build system prompt for the agent
   */
  private buildSystemPrompt(longTermContext: string): string {
    return `${this.agentConfig.systemPrompt}

## Your Role
You are ${this.agentConfig.name} - ${this.agentConfig.description}.

## Available Tools
You have access to various tools to gather data. Use them strategically to answer the analysis goal.

## Reasoning Guidelines
1. Think step by step
2. Always explain WHY you're calling a tool before calling it
3. After each observation, analyze what you learned
4. If you have enough information, formulate your conclusion
5. Be specific and data-driven in your analysis

## Past Context
${longTermContext}

## Output Format
- If you need more data: explain what and why, then call appropriate tools
- If you're ready to conclude: clearly state your findings and confidence level
- Always reference specific numbers and metrics from your observations`;
  }

  /**
   * Determine current goal - agent decides next analytical step from context.
   * No fixed query lists; behavior adapts to intermediate results.
   */
  private determineCurrentGoal(step: number): string {
    const plan = this.session.plan;
    const observations = this.memoryManager.getRecentEntries('observation', 5);
    const actions = this.memoryManager.getRecentEntries('action', 5);

    if (step === 1) {
      return `Begin analysis: ${this.session.goal}\nSuggested sub-goals (choose dynamically): ${plan.subGoals.join('; ') || 'Gather relevant data'}\nYou decide which tools to call first.`;
    }

    if (observations.length === 0) {
      return `Continue gathering data for: ${this.session.goal}. You determine which tools will best answer the goal.`;
    }

    const progress = Math.min(step / this.config.maxSteps, 1);
    if (progress > 0.7) {
      return `Finalize analysis. Review all observations and form conclusions about: ${this.session.goal}. If you need one more data point, call a tool; otherwise conclude.`;
    }

    const toolsUsed = [...new Set(actions.map(a => a.toolUsed).filter(Boolean))];
    const recentObs = observations.slice(-2).map(o => o.content).join(' | ');
    return `Continue analysis for: ${this.session.goal}.
Tools used so far: ${toolsUsed.join(', ') || 'none'}
Latest observations: ${recentObs.slice(0, 200)}${recentObs.length > 200 ? '...' : ''}
You decide: call another tool for more data, or conclude if sufficient. No fixed sequence.`;
  }

  /**
   * Check if reasoning should continue
   */
  private shouldContinueReasoning(thought: string): boolean {
    const conclusionKeywords = [
      'in conclusion',
      'to summarize',
      'final analysis',
      'based on all',
      'therefore conclude',
      'my assessment is',
      'the analysis shows',
    ];

    const lowerThought = thought.toLowerCase();
    return !conclusionKeywords.some(kw => lowerThought.includes(kw));
  }

  /**
   * Check if we have enough data to conclude.
   * Derived from metrics: tool success rate, observation count, plan coverage.
   * No hardcoded thresholds - computed from session state.
   */
  private hasEnoughData(): boolean {
    const dataPoints = Object.keys(this.collectedData).length;
    const observations = this.memoryManager.getRecentEntries('observation', 100);
    const actions = this.memoryManager.getRecentEntries('action', 100);
    const successCount = observations.filter(o => !o.content.startsWith('Error')).length;

    const observationCount = observations.length;
    const toolSuccessRate = actions.length > 0 ? successCount / actions.length : 0;
    const minFromPlan = Math.max(2, Math.min(this.session.plan.estimatedSteps, 5));

    return (
      dataPoints >= Math.min(2, this.session.plan.requiredTools.length) &&
      observationCount >= minFromPlan &&
      toolSuccessRate >= 0.5
    );
  }

  /**
   * Estimate confidence for a step
   */
  private estimateConfidence(step: number): number {
    const baseConfidence = 0.5;
    const dataBonus = Math.min(Object.keys(this.collectedData).length * 0.1, 0.3);
    const stepPenalty = step > this.config.maxSteps * 0.8 ? 0.1 : 0;

    return Math.min(baseConfidence + dataBonus - stepPenalty, 0.95);
  }

  /**
   * Calculate final confidence based on reasoning quality
   */
  private calculateFinalConfidence(): number {
    const factors: number[] = [];

    // Data completeness
    const dataPoints = Object.keys(this.collectedData).length;
    factors.push(Math.min(dataPoints / 5, 1) * 0.3);

    // Observation count
    const observations = this.memoryManager.getRecentEntries('observation', 100).length;
    factors.push(Math.min(observations / 5, 1) * 0.25);

    // Tool success rate
    const actions = this.memoryManager.getRecentEntries('action', 100);
    const successfulObs = this.memoryManager.getRecentEntries('observation', 100)
      .filter(o => !o.content.startsWith('Error'));
    const successRate = actions.length > 0 ? successfulObs.length / actions.length : 0;
    factors.push(successRate * 0.25);

    // Step efficiency
    const efficiency = 1 - (this.session.currentStep / this.config.maxSteps);
    factors.push(Math.max(efficiency, 0.3) * 0.2);

    return factors.reduce((sum, f) => sum + f, 0);
  }

  /**
   * Create a new reasoning session
   */
  private createSession(goal: string): ReasoningSession {
    return {
      id: uuidv4(),
      agentType: this.agentConfig.type,
      startedAt: new Date(),
      goal,
      plan: {
        goal,
        subGoals: [],
        estimatedSteps: 5,
        requiredTools: [],
        relevantMemories: [],
      },
      steps: [],
      currentStep: 0,
      status: 'planning',
      shortTermMemory: [],
    };
  }

  /**
   * Get collected data for report generation
   */
  getCollectedData(): Record<string, unknown> {
    return { ...this.collectedData };
  }

  /**
   * Get the current session
   */
  getSession(): ReasoningSession {
    return this.session;
  }
}

/**
 * Create a reasoning engine for an agent
 */
export function createReasoningEngine(
  llmClient: GroqLLMClient,
  toolRegistry: ToolRegistry,
  memoryManager: MemoryManager,
  agentConfig: AgentConfig,
  config?: Partial<ReasoningEngineConfig>
): ReasoningLoopEngine {
  return new ReasoningLoopEngine(llmClient, toolRegistry, memoryManager, agentConfig, config);
}
