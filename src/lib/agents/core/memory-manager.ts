/**
 * Memory Manager
 *
 * Manages both short-term (session) and long-term (database) memory for AI agents.
 * - Short-term: Tracks reasoning steps within a single execution
 * - Long-term: Persists insights across sessions, enables trend comparison
 */

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import type {
  ShortTermMemoryEntry,
  LongTermMemoryEntry,
  MemoryQuery,
  AgentType,
  ThoughtStep,
} from './types';

export class MemoryManager {
  private sessionId: string;
  private agentType: AgentType;
  private shortTermMemory: ShortTermMemoryEntry[] = [];
  private maxShortTermEntries: number;

  constructor(agentType: AgentType, maxShortTermEntries = 50) {
    this.sessionId = uuidv4();
    this.agentType = agentType;
    this.maxShortTermEntries = maxShortTermEntries;
  }

  // ============================================================
  // SHORT-TERM MEMORY (Session State)
  // ============================================================

  /**
   * Add a thought to short-term memory
   */
  addThought(content: string, confidence?: number): string {
    const entry = this.createEntry('thought', content, undefined, undefined, undefined, confidence);
    this.shortTermMemory.push(entry);
    this.trimShortTermMemory();
    return entry.id;
  }

  /**
   * Add an action (tool call) to short-term memory
   */
  addAction(toolName: string, toolInput: unknown, reasoning: string): string {
    const entry = this.createEntry(
      'action',
      reasoning,
      toolName,
      toolInput,
      undefined
    );
    this.shortTermMemory.push(entry);
    this.trimShortTermMemory();
    return entry.id;
  }

  /**
   * Add an observation (tool result) to short-term memory
   */
  addObservation(toolName: string, toolOutput: unknown, summary: string): string {
    const entry = this.createEntry(
      'observation',
      summary,
      toolName,
      undefined,
      toolOutput
    );
    this.shortTermMemory.push(entry);
    this.trimShortTermMemory();
    return entry.id;
  }

  /**
   * Add a conclusion to short-term memory
   */
  addConclusion(content: string, confidence: number): string {
    const entry = this.createEntry('conclusion', content, undefined, undefined, undefined, confidence);
    this.shortTermMemory.push(entry);
    return entry.id;
  }

  /**
   * Get all short-term memory entries
   */
  getShortTermMemory(): ShortTermMemoryEntry[] {
    return [...this.shortTermMemory];
  }

  /**
   * Get recent entries of a specific type
   */
  getRecentEntries(type: ShortTermMemoryEntry['type'], limit = 5): ShortTermMemoryEntry[] {
    return this.shortTermMemory
      .filter(e => e.type === type)
      .slice(-limit);
  }

  /**
   * Get the last N entries
   */
  getLastEntries(n: number): ShortTermMemoryEntry[] {
    return this.shortTermMemory.slice(-n);
  }

  /**
   * Format short-term memory as a string for LLM context
   */
  formatForLLM(maxEntries = 20): string {
    const recent = this.shortTermMemory.slice(-maxEntries);
    if (recent.length === 0) return 'No previous reasoning steps.';

    return recent.map((entry, i) => {
      const prefix = `[${i + 1}] ${entry.type.toUpperCase()}`;
      let text = `${prefix}: ${entry.content}`;

      if (entry.toolUsed) {
        text += `\n    Tool: ${entry.toolUsed}`;
      }
      if (entry.toolOutput) {
        const outputStr = typeof entry.toolOutput === 'string'
          ? entry.toolOutput
          : JSON.stringify(entry.toolOutput, null, 2);
        // Truncate long outputs
        const truncated = outputStr.length > 500
          ? outputStr.slice(0, 500) + '...'
          : outputStr;
        text += `\n    Output: ${truncated}`;
      }
      if (entry.confidence !== undefined) {
        text += `\n    Confidence: ${(entry.confidence * 100).toFixed(0)}%`;
      }

      return text;
    }).join('\n\n');
  }

  /**
   * Convert short-term memory to thought steps
   */
  toThoughtSteps(): ThoughtStep[] {
    let stepNum = 0;
    const steps: ThoughtStep[] = [];
    let currentStep: Partial<ThoughtStep> | null = null;

    for (const entry of this.shortTermMemory) {
      if (entry.type === 'thought') {
        if (currentStep) {
          steps.push(currentStep as ThoughtStep);
        }
        stepNum++;
        currentStep = {
          id: entry.id,
          step: stepNum,
          thought: entry.content,
          shouldContinue: true,
          confidence: entry.confidence ?? 0.5,
        };
      } else if (entry.type === 'action' && currentStep) {
        currentStep.action = {
          tool: entry.toolUsed!,
          input: entry.toolInput as Record<string, unknown>,
          reasoning: entry.content,
        };
      } else if (entry.type === 'observation' && currentStep) {
        currentStep.observation = entry.content;
      } else if (entry.type === 'conclusion') {
        if (currentStep) {
          currentStep.shouldContinue = false;
          steps.push(currentStep as ThoughtStep);
        }
        stepNum++;
        steps.push({
          id: entry.id,
          step: stepNum,
          thought: entry.content,
          shouldContinue: false,
          confidence: entry.confidence ?? 0.8,
        });
        currentStep = null;
      }
    }

    if (currentStep) {
      steps.push(currentStep as ThoughtStep);
    }

    return steps;
  }

  /**
   * Clear short-term memory
   */
  clearShortTermMemory(): void {
    this.shortTermMemory = [];
  }

  private createEntry(
    type: ShortTermMemoryEntry['type'],
    content: string,
    toolUsed?: string,
    toolInput?: unknown,
    toolOutput?: unknown,
    confidence?: number
  ): ShortTermMemoryEntry {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      content,
      toolUsed,
      toolInput,
      toolOutput,
      confidence,
    };
  }

  private trimShortTermMemory(): void {
    if (this.shortTermMemory.length > this.maxShortTermEntries) {
      this.shortTermMemory = this.shortTermMemory.slice(-this.maxShortTermEntries);
    }
  }

  // ============================================================
  // LONG-TERM MEMORY (Database Persistence)
  // ============================================================

  /**
   * Save an insight to long-term memory (database)
   */
  async saveInsight(insight: Omit<LongTermMemoryEntry, 'id' | 'createdAt' | 'isResolved'>): Promise<string> {
    const record = await prisma.aIAgentInsight.create({
      data: {
        agentType: insight.agentType,
        category: insight.category,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        metrics: insight.metrics as Record<string, unknown>,
        confidence: insight.confidence,
      },
    });

    return record.id;
  }

  /**
   * Query long-term memory for relevant past insights
   */
  async queryInsights(query: MemoryQuery): Promise<LongTermMemoryEntry[]> {
    const where: Record<string, unknown> = {};

    if (query.agentType) {
      where.agentType = query.agentType;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.unresolvedOnly) {
      where.isResolved = false;
    }

    if (query.timeRange) {
      where.createdAt = {
        gte: query.timeRange.start,
        lte: query.timeRange.end,
      };
    }

    const records = await prisma.aIAgentInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 20,
    });

    return records.map(r => ({
      id: r.id,
      agentType: r.agentType as AgentType,
      category: r.category,
      severity: r.severity as 'info' | 'warning' | 'critical',
      title: r.title,
      description: r.description,
      recommendation: r.recommendation ?? undefined,
      metrics: r.metrics as Record<string, number | string>,
      confidence: r.confidence,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt ?? undefined,
      isResolved: r.isResolved,
    }));
  }

  /**
   * Get recent insights for context
   */
  async getRecentInsights(days = 7, limit = 10): Promise<LongTermMemoryEntry[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.queryInsights({
      agentType: this.agentType,
      timeRange: { start: since, end: new Date() },
      limit,
    });
  }

  /**
   * Get recent insights from ALL agents (cross-agent coordination)
   * Useful for Co-Founder AI to aggregate insights from all agents
   */
  async getRecentCrossAgentInsights(hoursBack = 8, limit = 20): Promise<LongTermMemoryEntry[]> {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    const records = await prisma.aIAgentInsight.findMany({
      where: {
        createdAt: {
          gte: since,
        },
        // Exclude insights from the current agent to avoid duplication
        agentType: {
          not: this.agentType,
        },
      },
      orderBy: [
        { severity: 'desc' }, // Critical first
        { createdAt: 'desc' }, // Then by recency
      ],
      take: limit,
    });

    return records.map(r => ({
      id: r.id,
      agentType: r.agentType as AgentType,
      category: r.category,
      severity: r.severity as 'info' | 'warning' | 'critical',
      title: r.title,
      description: r.description,
      recommendation: r.recommendation ?? undefined,
      metrics: r.metrics as Record<string, number | string>,
      confidence: r.confidence,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt ?? undefined,
      isResolved: r.isResolved,
    }));
  }

  /**
   * Format cross-agent insights for LLM context
   * Groups insights by agent type for better readability
   */
  async formatCrossAgentInsightsForLLM(hoursBack = 8, limit = 20): Promise<string> {
    const insights = await this.getRecentCrossAgentInsights(hoursBack, limit);

    if (insights.length === 0) {
      return 'No recent insights from other AI agents.';
    }

    // Group by agent type
    const groupedByAgent = insights.reduce((acc, insight) => {
      if (!acc[insight.agentType]) {
        acc[insight.agentType] = [];
      }
      acc[insight.agentType].push(insight);
      return acc;
    }, {} as Record<string, LongTermMemoryEntry[]>);

    // Format by agent
    const sections = Object.entries(groupedByAgent).map(([agentType, agentInsights]) => {
      const agentName = agentType.replace(/_/g, ' ');
      const insightList = agentInsights.map((insight, i) => {
        const time = insight.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const status = insight.isResolved ? '[RESOLVED]' : '[ACTIVE]';
        const confidenceStr = `${(insight.confidence * 100).toFixed(0)}% confidence`;

        return `  ${i + 1}. [${time}] ${status} ${insight.severity.toUpperCase()}: ${insight.title}
     ${insight.description}
     ${insight.recommendation ? `Recommendation: ${insight.recommendation}` : ''}
     ${confidenceStr}`;
      }).join('\n\n');

      return `${agentName} (${agentInsights.length} insights):\n${insightList}`;
    });

    return `Recent insights from other AI agents (last ${hoursBack} hours):\n\n${sections.join('\n\n---\n\n')}`;
  }

  /**
   * Get similar past insights for comparison
   */
  async getSimilarInsights(category: string, limit = 5): Promise<LongTermMemoryEntry[]> {
    return this.queryInsights({
      agentType: this.agentType,
      category,
      limit,
    });
  }

  /**
   * Get unresolved issues
   */
  async getUnresolvedIssues(limit = 10): Promise<LongTermMemoryEntry[]> {
    return this.queryInsights({
      agentType: this.agentType,
      unresolvedOnly: true,
      limit,
    });
  }

  /**
   * Format long-term memory for LLM context
   */
  async formatLongTermForLLM(limit = 10): Promise<string> {
    const insights = await this.getRecentInsights(7, limit);

    if (insights.length === 0) {
      return 'No recent insights from previous analyses.';
    }

    return insights.map((insight, i) => {
      const date = insight.createdAt.toISOString().split('T')[0];
      const status = insight.isResolved ? '[RESOLVED]' : '[ACTIVE]';
      return `${i + 1}. [${date}] ${status} ${insight.severity.toUpperCase()}: ${insight.title}
   ${insight.description}
   ${insight.recommendation ? `Recommendation: ${insight.recommendation}` : ''}`;
    }).join('\n\n');
  }

  /**
   * Check for recurring issues
   */
  async checkRecurringIssues(category: string, windowDays = 30): Promise<{
    isRecurring: boolean;
    occurrences: number;
    pattern?: string;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - windowDays);

    const insights = await this.queryInsights({
      agentType: this.agentType,
      category,
      timeRange: { start: since, end: new Date() },
      limit: 100,
    });

    const occurrences = insights.length;
    const isRecurring = occurrences >= 3;

    let pattern: string | undefined;
    if (isRecurring) {
      // Simple pattern detection based on severity distribution
      const severityCounts = insights.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominant = Object.entries(severityCounts)
        .sort((a, b) => b[1] - a[1])[0];

      pattern = `${occurrences} occurrences in ${windowDays} days, mostly ${dominant[0]} severity`;
    }

    return { isRecurring, occurrences, pattern };
  }

  /**
   * Mark an insight as resolved
   */
  async resolveInsight(insightId: string): Promise<void> {
    await prisma.aIAgentInsight.update({
      where: { id: insightId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  getSessionId(): string {
    return this.sessionId;
  }

  getAgentType(): AgentType {
    return this.agentType;
  }

  /**
   * Export session data for debugging/logging
   */
  exportSession(): {
    sessionId: string;
    agentType: AgentType;
    shortTermMemory: ShortTermMemoryEntry[];
    thoughtSteps: ThoughtStep[];
  } {
    return {
      sessionId: this.sessionId,
      agentType: this.agentType,
      shortTermMemory: this.getShortTermMemory(),
      thoughtSteps: this.toThoughtSteps(),
    };
  }
}

/**
 * Create a new memory manager for an agent execution
 */
export function createMemoryManager(agentType: AgentType): MemoryManager {
  return new MemoryManager(agentType);
}
