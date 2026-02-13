/**
 * Tool Registry
 *
 * Central registry for all tools available to AI agents.
 * Handles tool registration, lookup, and execution.
 * Converts tools to LLM-compatible format for dynamic selection.
 */

import type {
  Tool,
  ToolSchema,
  ToolCategory,
  ToolExecutionResult,
  LLMToolDefinition,
  AgentType,
} from './types';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private toolsByCategory: Map<ToolCategory, Set<string>> = new Map();
  private toolsByAgent: Map<AgentType, Set<string>> = new Map();

  /**
   * Register a tool in the registry
   */
  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    const { name, category } = tool.schema;

    if (this.tools.has(name)) {
      console.warn(`[ToolRegistry] Overwriting existing tool: ${name}`);
    }

    this.tools.set(name, tool as Tool);

    // Index by category
    if (!this.toolsByCategory.has(category)) {
      this.toolsByCategory.set(category, new Set());
    }
    this.toolsByCategory.get(category)!.add(name);
  }

  /**
   * Register tools for a specific agent type
   */
  registerForAgent(agentType: AgentType, toolNames: string[]): void {
    if (!this.toolsByAgent.has(agentType)) {
      this.toolsByAgent.set(agentType, new Set());
    }

    const agentTools = this.toolsByAgent.get(agentType)!;
    for (const name of toolNames) {
      if (this.tools.has(name)) {
        agentTools.add(name);
      } else {
        console.warn(`[ToolRegistry] Tool not found for agent ${agentType}: ${name}`);
      }
    }
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools for an agent type
   */
  getForAgent(agentType: AgentType): Tool[] {
    const toolNames = this.toolsByAgent.get(agentType);
    if (!toolNames) return [];

    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((t): t is Tool => t !== undefined);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): Tool[] {
    const toolNames = this.toolsByCategory.get(category);
    if (!toolNames) return [];

    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((t): t is Tool => t !== undefined);
  }

  /**
   * Get all registered tool names
   */
  getAllNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool schemas
   */
  getAllSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map(t => t.schema);
  }

  /**
   * Convert tools to LLM-compatible format for a specific agent
   */
  toLLMFormat(agentType: AgentType): LLMToolDefinition[] {
    const tools = this.getForAgent(agentType);
    return tools.map(tool => this.toolToLLMFormat(tool));
  }

  /**
   * Convert all tools to LLM format
   */
  allToLLMFormat(): LLMToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => this.toolToLLMFormat(tool));
  }

  /**
   * Convert a single tool to LLM format
   */
  private toolToLLMFormat(tool: Tool): LLMToolDefinition {
    const { schema } = tool;

    const properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }> = {};

    const required: string[] = [];

    for (const param of schema.parameters) {
      properties[param.name] = {
        type: param.type,
        description: param.description,
        ...(param.enum && { enum: param.enum }),
      };

      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: 'function',
      function: {
        name: schema.name,
        description: schema.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };
  }

  /**
   * Execute a tool by name with given input
   */
  async execute(
    name: string,
    input: unknown
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
        executionTimeMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      const result = await tool.execute(input);
      return {
        ...result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse tool call arguments from LLM response
   */
  parseToolCall(name: string, argumentsJson: string): unknown {
    try {
      return JSON.parse(argumentsJson);
    } catch {
      console.error(`[ToolRegistry] Failed to parse arguments for ${name}:`, argumentsJson);
      return {};
    }
  }

  /**
   * Validate tool input against schema
   */
  validateInput(name: string, input: unknown): { valid: boolean; errors: string[] } {
    const tool = this.tools.get(name);
    if (!tool) {
      return { valid: false, errors: [`Tool not found: ${name}`] };
    }

    const errors: string[] = [];
    const inputObj = input as Record<string, unknown>;

    for (const param of tool.schema.parameters) {
      if (param.required && !(param.name in inputObj)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in inputObj) {
        const value = inputObj[param.name];
        if (!this.checkType(value, param.type)) {
          errors.push(`Invalid type for ${param.name}: expected ${param.type}`);
        }

        if (param.enum && !param.enum.includes(String(value))) {
          errors.push(`Invalid value for ${param.name}: must be one of ${param.enum.join(', ')}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private checkType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }
}

// Singleton instance
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}

/**
 * Helper function to create a tool with type safety
 */
export function createTool<TInput, TOutput>(
  schema: ToolSchema,
  execute: (input: TInput) => Promise<ToolExecutionResult<TOutput>>
): Tool<TInput, TOutput> {
  return { schema, execute };
}
