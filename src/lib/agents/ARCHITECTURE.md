# TRUE AUTONOMOUS AI AGENT ARCHITECTURE

## 1. Updated Folder Structure

```
src/lib/agents/
├── core/                          # Unified agent core
│   ├── agent-controller.ts        # Main orchestrator, agent configs, execution
│   ├── groq-client.ts            # Groq LLM integration with tool calling
│   ├── index.ts
│   ├── memory-manager.ts         # Short-term + long-term memory
│   ├── reasoning-engine.ts      # ReAct reasoning loop
│   ├── report-generator.ts      # Structured executive reporting
│   ├── tool-registry.ts         # Central tool registry
│   └── types.ts
├── tools/
│   ├── index.ts                  # Tool init, agent mappings
│   ├── analytics-tools.ts
│   ├── content-tools.ts
│   ├── memory-tools.ts
│   ├── pipeline-tools.ts         # run_anomaly_scan, compute_churn_scores, run_data_quality_monitor, run_analytics_aggregation, run_risk_scoring
│   ├── security-tools.ts
│   ├── system-tools.ts
│   ├── user-tools.ts
│   └── ux-tools.ts
├── examples/
│   └── demo-execution.ts
├── index.ts
└── ARCHITECTURE.md

src/app/api/cron/
├── ai-agents/route.ts            # All agents by schedule
├── anomaly-detection/route.ts    # ANOMALY_DETECTOR agent
├── churn-prediction/route.ts     # CHURN_PREDICTOR agent
├── risk-scoring/route.ts         # SECURITY_SENTINEL agent
├── data-quality/route.ts         # BUSINESS_ANALYST agent
├── analytics-aggregation/route.ts# BUSINESS_ANALYST agent
├── system-metrics/route.ts       # Infrastructure (metrics collection)
└── ...

src/app/api/owner/
├── advisor/route.ts              # AI-driven via BUSINESS_ANALYST
├── agents/run/route.ts
└── ...
```

## 2. Unified Agent Core

**Entry:** `AgentController.execute(input)`

Flow:

1. Resolve agent config → create MemoryManager, ReasoningLoopEngine, ReportGenerator
2. `reasoningEngine.execute(goal)` runs full ReAct loop
3. `reportGenerator.generate(session, collectedData)` produces ExecutiveReport
4. Save insights to long-term memory via `memoryManager.saveInsight()`

Agents: BUSINESS_ANALYST, GROWTH_STRATEGIST, SECURITY_SENTINEL, UX_AGENT, CONTENT_INTELLIGENCE, LEGAL_COMPLIANCE, CHURN_PREDICTOR, ANOMALY_DETECTOR

## 3. Tool Registry Implementation

- **Central registry:** `ToolRegistry` (singleton via `getToolRegistry()`)
- **Structured definitions:** `ToolSchema` with name, description, category, parameters (name, type, description, required, enum)
- **LLM format:** `toLLMFormat(agentType)` produces OpenAI-compatible function definitions
- **Execution:** `execute(name, input)` validates, runs, returns `ToolExecutionResult`
- **Per-agent mapping:** `registerForAgent(agentType, toolNames)` in `tools/index.ts`

Pipeline tools wrap deterministic modules so agents invoke them as data sources:

- `run_anomaly_scan` → anomaly-detection logic
- `compute_churn_scores` → churn-prediction logic
- `run_data_quality_monitor` → data-quality-monitor
- `run_analytics_aggregation` → retention, lifecycle, data-quality
- `run_risk_scoring` → risk-scoring

## 4. Short-Term Memory Implementation

**File:** `core/memory-manager.ts`

- **Storage:** In-memory `ShortTermMemoryEntry[]` per session
- **Types:** thought, action, observation, conclusion
- **Methods:** `addThought`, `addAction`, `addObservation`, `addConclusion`
- **Context for LLM:** `formatForLLM(maxEntries)` formats recent entries
- **Export:** `toThoughtSteps()` for report trace
- **Trim:** `maxShortTermEntries` (default 50) to prevent unbounded growth

## 5. Long-Term Memory Retrieval Implementation

**File:** `core/memory-manager.ts`

- **Persistence:** `prisma.aIAgentInsight`
- **Save:** `saveInsight()` after report generation
- **Query:** `queryInsights()`, `getRecentInsights()`, `getSimilarInsights()`, `getUnresolvedIssues()`
- **Recurring patterns:** `checkRecurringIssues(category, windowDays)`
- **LLM context:** `formatLongTermForLLM(limit)` injects past insights into prompts
- **Tools:** `query_past_insights`, `get_anomaly_history`, `get_metric_baselines`

## 6. Groq Integration

**File:** `core/groq-client.ts`

- **API:** `https://api.groq.com/openai/v1/chat/completions`
- **Model:** `llama-3.3-70b-versatile`
- **Key rotation:** `callGroqWithKeyRetry`, `getNextGroqKey` from `@/lib/ai/groq-keys`
- **Tool calling:** `chat()` with `tools`, `tool_choice: 'auto'`
- **Reasoning:** `generateReasoningStep()`, `generatePlan()`, `generateStructuredReport()`

## 7. Reasoning Loop Implementation

**File:** `core/reasoning-engine.ts`

**Phase 1 – Planning:**

- Fetch `getRecentInsights`, `getUnresolvedIssues`
- LLM `generatePlan(goal, toolNames, relevantMemories)` → ReasoningPlan

**Phase 2 – Execution Loop (ReAct):**

```
while step < maxSteps:
  currentGoal = determineCurrentGoal(step)  # Context-aware, no fixed sequence
  response = llmClient.generateReasoningStep(systemPrompt, currentGoal, previousSteps, tools)
  for toolCall in response.toolCalls:
    executeToolCall(toolCall.function.name, toolCall.function.arguments)
    # Records: addAction → execute → addObservation
  addThought(response.content)
  if !shouldContinueReasoning(content) or hasEnoughData(): break
```

**Phase 3 – Conclusion:**

- `calculateFinalConfidence()` from data completeness, observations, tool success, efficiency
- `generateConclusionText(reasoningTrace)` via LLM
- `memoryManager.addConclusion()`

## 8. Execution Flow for Admin-Level Analytical Question

**Example:** "Why is engagement declining and what should we do?"

1. **API/Cron:** `runAgentWithGoal('BUSINESS_ANALYST', goal)`
2. **Planning:** LLM generates plan with sub-goals and tool list
3. **Loop Step 1:** LLM decides → calls `get_engagement_metrics`, `get_user_metrics`
4. **Observe:** Tool results stored in short-term memory
5. **Loop Step 2:** LLM sees observations → calls `get_retention_metrics`, `query_past_insights`
6. **Loop Step 3:** LLM concludes based on data
7. **Report:** ExecutiveSummary, KeyMetrics, TrendAnalysis, RootCauses, Recommendations, ConfidenceScore
8. **Long-term:** High-priority insights saved to `AIAgentInsight`

**Cron example (anomaly-detection):**

- `GET /api/cron/anomaly-detection` → `runAgent('ANOMALY_DETECTOR')`
- Agent calls `run_anomaly_scan` → then `get_anomaly_history`, `query_past_insights`
- Structured report + insights persisted

## 9. Requirement Compliance

| #   | Requirement                    | Status                                                                                  |
| --- | ------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | Goal-driven reasoning          | ✓ Dynamic interpretation in `planAnalysis`, `determineCurrentGoal`                      |
| 2   | Multi-step ReAct loop          | ✓ Think → Choose Tool → Execute → Observe → Refine in `runReasoningLoop`                |
| 3   | Dynamic decision-making        | ✓ LLM selects tools per step; `determineCurrentGoal` uses observations                  |
| 4   | Short-term memory              | ✓ `MemoryManager` session state, `formatForLLM` for context                             |
| 5   | Long-term memory               | ✓ `queryInsights`, `getRecentInsights`, `checkRecurringIssues`                          |
| 6   | Tool abstraction layer         | ✓ `ToolRegistry`, structured schemas, `toLLMFormat`                                     |
| 7   | Autonomous execution           | ✓ All AI crons invoke agents; pipeline tools used by agents                             |
| 8   | Numerical validation           | ✓ No hardcoded confidence; `calculateFinalConfidence` from metrics                      |
| 9   | Structured executive reporting | ✓ ExecutiveReport: Summary, Metrics, Trends, Risks, Causes, Recommendations, Confidence |
| 10  | True autonomy                  | ✓ LLM decides next step; multiple tool calls; no fixed query lists                      |

All 10 requirements are satisfied.
