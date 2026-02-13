/**
 * Enhanced Groq LLM Client for AI Agents
 *
 * Provides tool-calling capabilities, structured output parsing,
 * and reasoning-specific prompting for the ReAct loop.
 */

import { callGroqWithKeyRetry, getNextGroqKey } from '@/lib/ai/groq-keys';
import type {
  LLMMessage,
  LLMResponse,
  LLMToolCall,
  LLMToolDefinition,
} from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export interface GroqClientConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface GroqChatRequest {
  messages: LLMMessage[];
  tools?: LLMToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
}

interface GroqAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqLLMClient {
  private config: Required<GroqClientConfig>;

  constructor(config: GroqClientConfig = {}) {
    this.config = {
      model: config.model ?? DEFAULT_MODEL,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      timeoutMs: config.timeoutMs ?? 120000,
    };
  }

  /**
   * Send a chat completion request with optional tool calling
   */
  async chat(request: GroqChatRequest): Promise<LLMResponse> {
    const {
      messages,
      tools,
      toolChoice,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
      responseFormat,
    } = request;

    // Build request body
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.toolCallId && { tool_call_id: m.toolCallId }),
        ...(m.name && { name: m.name }),
      })),
      temperature,
      max_tokens: maxTokens,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = toolChoice ?? 'auto';
    }

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    try {
      const response = await callGroqWithKeyRetry<GroqAPIResponse>(async (apiKey) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
          const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return res;
        } catch (e) {
          clearTimeout(timeout);
          throw e;
        }
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('[GroqLLMClient] Chat error:', error);
      return {
        content: null,
        finishReason: 'error',
      };
    }
  }

  /**
   * Parse Groq API response into standardized format
   */
  private parseResponse(response: GroqAPIResponse): LLMResponse {
    const choice = response.choices?.[0];

    if (!choice) {
      return {
        content: null,
        finishReason: 'error',
      };
    }

    const toolCalls: LLMToolCall[] | undefined = choice.message.tool_calls?.map(tc => ({
      id: tc.id,
      type: tc.type,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));

    return {
      content: choice.message.content,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool_calls':
        return 'tool_calls';
      case 'length':
        return 'length';
      default:
        return 'error';
    }
  }

  /**
   * Generate a reasoning step using the ReAct format
   */
  async generateReasoningStep(
    systemPrompt: string,
    currentThought: string,
    previousSteps: string[],
    availableTools: LLMToolDefinition[],
    observation?: string
  ): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: this.buildReasoningPrompt(currentThought, previousSteps, observation),
      },
    ];

    return this.chat({
      messages,
      tools: availableTools,
      toolChoice: 'auto',
      temperature: 0.2, // Lower temperature for reasoning
    });
  }

  private buildReasoningPrompt(
    thought: string,
    previousSteps: string[],
    observation?: string
  ): string {
    let prompt = '';

    if (previousSteps.length > 0) {
      prompt += '## Previous Reasoning Steps\n';
      previousSteps.forEach((step, i) => {
        prompt += `Step ${i + 1}: ${step}\n`;
      });
      prompt += '\n';
    }

    if (observation) {
      prompt += `## Latest Observation\n${observation}\n\n`;
    }

    prompt += `## Current Task\n${thought}\n\n`;
    prompt += `Based on the above, decide your next action. You may:\n`;
    prompt += `1. Call a tool to gather more data\n`;
    prompt += `2. Analyze the observations you have\n`;
    prompt += `3. Formulate your conclusion if you have enough information\n\n`;
    prompt += `Think step by step and explain your reasoning.`;

    return prompt;
  }

  /**
   * Generate a structured report from reasoning results
   */
  async generateStructuredReport(
    agentType: string,
    reasoningTrace: string,
    collectedData: Record<string, unknown>
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are an AI business analyst generating an executive report.
Based on the reasoning trace and collected data, generate a structured report in JSON format with:
- executiveSummary: A 2-3 sentence high-level summary
- keyMetrics: Array of {name, value, unit, change, changeDirection}
- trendAnalysis: Array of {metric, direction, magnitude, description}
- detectedRisks: Array of {riskType, severity, probability, impact, mitigation}
- rootCauses: Array of {issue, cause, evidence, confidence}
- recommendations: Array of {action, priority, expectedImpact, effort, timeframe}
- confidenceScore: Number between 0 and 1
- confidenceFactors: Array of strings explaining confidence level

Be specific, data-driven, and actionable. Use the actual numbers from the data.`,
      },
      {
        role: 'user',
        content: `Agent Type: ${agentType}\n\n## Reasoning Trace\n${reasoningTrace}\n\n## Collected Data\n${JSON.stringify(collectedData, null, 2)}\n\nGenerate the executive report JSON:`,
      },
    ];

    const response = await this.chat({
      messages,
      temperature: 0.1,
      responseFormat: { type: 'json_object' },
      maxTokens: 4096,
    });

    return response.content ?? '{}';
  }

  /**
   * Parse a goal into a structured plan
   */
  async generatePlan(
    goal: string,
    availableTools: string[],
    relevantMemories: string[]
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a planning agent. Given a goal, create a structured analysis plan.
Output JSON with:
- goal: The interpreted goal
- subGoals: Array of specific sub-tasks to accomplish
- estimatedSteps: Number of steps needed
- requiredTools: Array of tool names needed
- approach: Brief description of the analysis approach`,
      },
      {
        role: 'user',
        content: `Goal: ${goal}\n\nAvailable Tools: ${availableTools.join(', ')}\n\nRelevant Past Insights:\n${relevantMemories.join('\n')}\n\nCreate the analysis plan:`,
      },
    ];

    const response = await this.chat({
      messages,
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    return response.content ?? '{}';
  }
}

// Singleton instance for shared usage
let clientInstance: GroqLLMClient | null = null;

export function getGroqClient(config?: GroqClientConfig): GroqLLMClient {
  if (!clientInstance || config) {
    clientInstance = new GroqLLMClient(config);
  }
  return clientInstance;
}
