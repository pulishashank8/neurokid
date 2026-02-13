/**
 * AI Agent Core Types
 *
 * Defines the fundamental types for the true AI agent architecture
 * with ReAct reasoning, tool usage, and memory management.
 */

// ============================================================
// TOOL TYPES
// ============================================================

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

export interface ToolSchema {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  returns: {
    type: string;
    description: string;
  };
}

export type ToolCategory =
  | 'database'
  | 'analytics'
  | 'security'
  | 'content'
  | 'user'
  | 'system'
  | 'memory';

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  schema: ToolSchema;
  execute: (input: TInput) => Promise<ToolExecutionResult<TOutput>>;
}

// ============================================================
// MEMORY TYPES
// ============================================================

export interface ShortTermMemoryEntry {
  id: string;
  timestamp: Date;
  type: 'thought' | 'action' | 'observation' | 'conclusion';
  content: string;
  toolUsed?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  confidence?: number;
}

export interface LongTermMemoryEntry {
  id: string;
  agentType: AgentType;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, number | string>;
  confidence: number;
  createdAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}

export interface MemoryQuery {
  agentType?: AgentType;
  category?: string;
  severity?: 'info' | 'warning' | 'critical';
  timeRange?: {
    start: Date;
    end: Date;
  };
  keywords?: string[];
  limit?: number;
  unresolvedOnly?: boolean;
}

// ============================================================
// REASONING TYPES
// ============================================================

export interface ThoughtStep {
  id: string;
  step: number;
  thought: string;
  action?: {
    tool: string;
    input: Record<string, unknown>;
    reasoning: string;
  };
  observation?: string;
  shouldContinue: boolean;
  confidence: number;
}

export interface ReasoningPlan {
  goal: string;
  subGoals: string[];
  estimatedSteps: number;
  requiredTools: string[];
  relevantMemories: LongTermMemoryEntry[];
}

export interface ReasoningSession {
  id: string;
  agentType: AgentType;
  startedAt: Date;
  goal: string;
  plan: ReasoningPlan;
  steps: ThoughtStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'observing' | 'concluding' | 'completed' | 'failed';
  shortTermMemory: ShortTermMemoryEntry[];
  finalConclusion?: string;
  finalConfidence?: number;
}

// ============================================================
// AGENT TYPES
// ============================================================

export type AgentType =
  | 'BUSINESS_ANALYST'
  | 'DATA_ANALYST'
  | 'GROWTH_STRATEGIST'
  | 'SECURITY_SENTINEL'
  | 'UX_AGENT'
  | 'CONTENT_INTELLIGENCE'
  | 'LEGAL_COMPLIANCE'
  | 'CHURN_PREDICTOR'
  | 'ANOMALY_DETECTOR'
  | 'CO_FOUNDER';

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  availableTools: string[];
  maxReasoningSteps: number;
  temperature: number;
  schedule?: string;
  enabled: boolean;
}

export interface AgentGoal {
  description: string;
  context?: Record<string, unknown>;
  constraints?: string[];
  expectedOutputFormat?: string;
}

// ============================================================
// REPORT TYPES
// ============================================================

export interface MetricValue {
  name: string;
  value: number;
  unit?: string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'stable';
  period?: string;
  benchmark?: number;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: 'significant' | 'moderate' | 'minor';
  description: string;
  dataPoints?: number[];
}

export interface RiskAssessment {
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation?: string;
}

export interface RootCause {
  issue: string;
  cause: string;
  evidence: string[];
  confidence: number;
}

export interface Recommendation {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeframe?: string;
}

export interface ExecutiveReport {
  agentType: AgentType;
  generatedAt: Date;
  sessionId: string;

  // Core sections
  executiveSummary: string;
  keyMetrics: MetricValue[];
  trendAnalysis: TrendAnalysis[];
  detectedRisks: RiskAssessment[];
  rootCauses: RootCause[];
  recommendations: Recommendation[];

  // Metadata
  confidenceScore: number;
  confidenceFactors: string[];
  reasoningSteps: number;
  toolsUsed: string[];
  dataSourcesQueried: string[];
  executionTimeMs: number;

  // Raw reasoning trace (for debugging)
  reasoningTrace?: ThoughtStep[];
}

// ============================================================
// EXECUTION TYPES
// ============================================================

export interface AgentExecutionInput {
  agentType: AgentType;
  goal?: AgentGoal;
  context?: Record<string, unknown>;
  useScheduledGoal?: boolean;
}

export interface AgentExecutionResult {
  success: boolean;
  report?: ExecutiveReport;
  error?: string;
  session: ReasoningSession;
}

// ============================================================
// LLM TYPES
// ============================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: LLMToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}
