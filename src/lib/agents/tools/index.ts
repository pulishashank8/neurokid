/**
 * Tools Index
 *
 * Exports all tools and provides initialization function.
 * Each agent has access to comprehensive tools for full AI-powered analysis.
 */

import { getToolRegistry } from '../core/tool-registry';
import type { AgentType, Tool } from '../core/types';

// Import all tool modules
import { userTools } from './user-tools';
import { securityTools } from './security-tools';
import { memoryTools } from './memory-tools';
import { analyticsTools } from './analytics-tools';
import { uxTools } from './ux-tools';
import { contentTools } from './content-tools';
import { systemTools } from './system-tools';
import { pipelineTools } from './pipeline-tools';

// ============================================================
// TOOL COLLECTIONS
// ============================================================

export const allTools: Tool[] = [
  ...userTools,
  ...securityTools,
  ...memoryTools,
  ...analyticsTools,
  ...uxTools,
  ...contentTools,
  ...systemTools,
  ...pipelineTools,
];

// ============================================================
// COMPREHENSIVE AGENT TOOL MAPPINGS
// Each agent has full access to relevant tools for powerful analysis
// ============================================================

const AGENT_TOOL_MAPPINGS: Record<AgentType, string[]> = {
  // Growth Strategist: Full access to user, growth, retention, engagement, lifecycle
  GROWTH_STRATEGIST: [
    // User & Growth
    'get_user_metrics',
    'get_growth_rates',
    'get_retention_metrics',
    'get_feature_adoption',
    'get_cohort_analysis',
    'get_churn_predictions',
    // Analytics
    'get_kpi_summary',
    'get_engagement_metrics',
    'get_lifecycle_metrics',
    'get_ai_usage_metrics',
    // Content
    'get_content_metrics',
    'get_trending_content',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Security Sentinel: Full access to security, activity, system monitoring + pipeline
  SECURITY_SENTINEL: [
    // Pipeline
    'run_risk_scoring',
    // Security
    'get_failed_logins',
    'get_suspicious_ips',
    'get_banned_users',
    'get_activity_anomalies',
    'get_rate_limit_events',
    'get_session_metrics',
    // System
    'get_system_metrics',
    'get_spike_detection',
    // Content (for spam detection)
    'get_spam_detection',
    'get_moderation_queue',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
    'get_metric_baselines',
  ],

  // Business Analyst: Full access to KPIs, costs, engagement, AI usage + pipelines
  BUSINESS_ANALYST: [
    // Pipelines
    'run_data_quality_monitor',
    'run_analytics_aggregation',
    // Analytics
    'get_kpi_summary',
    'get_ai_usage_metrics',
    'get_engagement_metrics',
    'get_lifecycle_metrics',
    // User & Growth
    'get_user_metrics',
    'get_growth_rates',
    'get_retention_metrics',
    'get_feature_adoption',
    'get_churn_predictions',
    // Content
    'get_content_metrics',
    // System
    'get_system_metrics',
    'get_data_quality_metrics',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // UX Agent: Full access to errors, performance, user flows, devices
  UX_AGENT: [
    // UX
    'get_error_metrics',
    'get_page_performance',
    'get_rage_clicks',
    'get_user_flow_analysis',
    'get_device_breakdown',
    // User
    'get_user_metrics',
    'get_feature_adoption',
    // Analytics
    'get_engagement_metrics',
    // System
    'get_system_metrics',
    'get_spike_detection',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Content Intelligence: Full access to content, moderation, trends, spam
  CONTENT_INTELLIGENCE: [
    // Content
    'get_content_metrics',
    'get_moderation_queue',
    'get_spam_detection',
    'get_trending_content',
    // User
    'get_user_metrics',
    'get_feature_adoption',
    // Analytics
    'get_engagement_metrics',
    // Security (for abuse detection)
    'get_activity_anomalies',
    'get_banned_users',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Legal Compliance: Full access to consent, user data, moderation
  LEGAL_COMPLIANCE: [
    // Content/Compliance
    'get_consent_metrics',
    'get_moderation_queue',
    // User
    'get_user_metrics',
    'get_banned_users',
    // Analytics
    'get_kpi_summary',
    // System
    'get_data_quality_metrics',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Churn Predictor: Full access to retention, lifecycle, engagement + pipeline
  CHURN_PREDICTOR: [
    // Pipeline (triggers deterministic churn computation)
    'compute_churn_scores',
    // User & Retention
    'get_user_metrics',
    'get_retention_metrics',
    'get_churn_predictions',
    'get_cohort_analysis',
    'get_feature_adoption',
    // Analytics
    'get_lifecycle_metrics',
    'get_engagement_metrics',
    'get_kpi_summary',
    // Content
    'get_content_metrics',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Data Analyst: Full access to ALL data tools for real-time analysis
  DATA_ANALYST: [
    // Pipelines (ensure fresh data)
    'run_analytics_aggregation',
    'run_data_quality_monitor',
    // User & Growth
    'get_user_metrics',
    'get_growth_rates',
    'get_retention_metrics',
    'get_feature_adoption',
    'get_cohort_analysis',
    'get_churn_predictions',
    // Analytics
    'get_kpi_summary',
    'get_ai_usage_metrics',
    'get_engagement_metrics',
    'get_lifecycle_metrics',
    // Content
    'get_content_metrics',
    'get_trending_content',
    // System & Quality
    'get_system_metrics',
    'get_data_quality_metrics',
    'get_spike_detection',
    'get_correlation_analysis',
    // UX
    'get_error_metrics',
    // Memory & Baselines
    'get_metric_baselines',
    'query_past_insights',
    'get_anomaly_history',
  ],

  // Anomaly Detector: Full access to all metrics, baselines, correlations + pipeline
  ANOMALY_DETECTOR: [
    // Pipeline (triggers deterministic scan)
    'run_anomaly_scan',
    // System
    'get_system_metrics',
    'get_spike_detection',
    'get_correlation_analysis',
    'get_data_quality_metrics',
    // User
    'get_user_metrics',
    'get_growth_rates',
    // Security
    'get_failed_logins',
    'get_activity_anomalies',
    'get_rate_limit_events',
    // UX
    'get_error_metrics',
    // Analytics
    'get_ai_usage_metrics',
    // Memory
    'query_past_insights',
    'get_anomaly_history',
    'get_metric_baselines',
  ],
};

// ============================================================
// INITIALIZATION
// ============================================================

let initialized = false;

/**
 * Initialize all tools and register them with the registry
 */
export function initializeTools(): void {
  if (initialized) {
    return;
  }

  const registry = getToolRegistry();

  // Register all tools
  for (const tool of allTools) {
    registry.register(tool);
  }

  // Register tools for each agent type
  for (const [agentType, toolNames] of Object.entries(AGENT_TOOL_MAPPINGS)) {
    registry.registerForAgent(agentType as AgentType, toolNames);
  }

  initialized = true;
  console.log(`[Tools] Initialized ${allTools.length} tools for ${Object.keys(AGENT_TOOL_MAPPINGS).length} agents`);
}

/**
 * Get tools for a specific agent
 */
export function getToolsForAgent(agentType: AgentType): string[] {
  return AGENT_TOOL_MAPPINGS[agentType] || [];
}

/**
 * Reset initialization (for testing)
 */
export function resetTools(): void {
  initialized = false;
}

// Re-export tool collections
export { userTools } from './user-tools';
export { securityTools } from './security-tools';
export { memoryTools } from './memory-tools';
export { analyticsTools } from './analytics-tools';
export { uxTools } from './ux-tools';
export { contentTools } from './content-tools';
export { systemTools } from './system-tools';
