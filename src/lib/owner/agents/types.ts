/**
 * Types for the AI Agent System
 */

export type AgentType =
  | 'BUSINESS_ANALYST'
  | 'LEGAL_COMPLIANCE'
  | 'UX_AGENT'
  | 'CONTENT_INTELLIGENCE'
  | 'SECURITY_SENTINEL'
  | 'GROWTH_STRATEGIST'
  | 'ISSUE_FIXER';

export type InsightCategory =
  | 'GROWTH'
  | 'RISK'
  | 'LEGAL'
  | 'UX_ISSUE'
  | 'CONTENT'
  | 'SECURITY'
  | 'COST';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface AgentInsight {
  agentType: AgentType;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, number | string>;
  confidence: number;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  schedule: string; // Cron-like description
  enabled: boolean;
}

export interface AgentResult {
  agentType: AgentType;
  success: boolean;
  insights: AgentInsight[];
  executionTimeMs: number;
  error?: string;
}

export interface AgentContext {
  now: Date;
  lookbackHours?: number;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    type: 'BUSINESS_ANALYST',
    name: 'Business Analyst',
    description: 'Monitors growth, costs, KPIs, and unit economics',
    schedule: 'Hourly',
    enabled: true,
  },
  {
    type: 'LEGAL_COMPLIANCE',
    name: 'Legal Compliance',
    description: 'Monitors GDPR, consent, content liability, and COPPA',
    schedule: 'Every 6 hours',
    enabled: true,
  },
  {
    type: 'UX_AGENT',
    name: 'UX Agent',
    description: 'Monitors errors, crashes, rage clicks, and slow pages',
    schedule: 'Every 15 minutes',
    enabled: true,
  },
  {
    type: 'CONTENT_INTELLIGENCE',
    name: 'Content Intelligence',
    description: 'Monitors spam, trending content, content gaps, and quality',
    schedule: 'Hourly',
    enabled: true,
  },
  {
    type: 'SECURITY_SENTINEL',
    name: 'Security Sentinel',
    description: 'Monitors brute force attempts, scraping, and session hijacking',
    schedule: 'Every 15 minutes',
    enabled: true,
  },
  {
    type: 'GROWTH_STRATEGIST',
    name: 'Growth Strategist',
    description: 'Analyzes forecasts, retention, and feature adoption',
    schedule: 'Daily',
    enabled: true,
  },
  {
    type: 'ISSUE_FIXER',
    name: 'Issue Fixer',
    description: 'Auto-remediates issues found by other agents (security blocks, notifications, re-engagement)',
    schedule: 'Hourly',
    enabled: true,
  },
];
