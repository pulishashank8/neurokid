'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  TrendingUp,
  Scale,
  MousePointer,
  FileText,
  Shield,
  BarChart3,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Filter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  PremiumPageHeader,
  PremiumCard,
  PremiumGrid,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

type AgentType =
  | 'BUSINESS_ANALYST'
  | 'LEGAL_COMPLIANCE'
  | 'UX_AGENT'
  | 'CONTENT_INTELLIGENCE'
  | 'SECURITY_SENTINEL'
  | 'GROWTH_STRATEGIST'
  | 'ISSUE_FIXER';

type Severity = 'info' | 'warning' | 'critical';

interface AgentStatus {
  type: AgentType;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  insights24h: number;
  lastRun?: string;
  status: 'idle' | 'running' | 'error';
}

interface AgentInsight {
  id: string;
  agentType: AgentType;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, number | string>;
  confidence: number;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

const AGENT_ICONS: Record<AgentType, typeof Bot> = {
  BUSINESS_ANALYST: BarChart3,
  LEGAL_COMPLIANCE: Scale,
  UX_AGENT: MousePointer,
  CONTENT_INTELLIGENCE: FileText,
  SECURITY_SENTINEL: Shield,
  GROWTH_STRATEGIST: TrendingUp,
  ISSUE_FIXER: Zap,
};

const AGENT_NAMES: Record<AgentType, string> = {
  BUSINESS_ANALYST: 'Business Analyst',
  LEGAL_COMPLIANCE: 'Legal Compliance',
  UX_AGENT: 'UX Agent',
  CONTENT_INTELLIGENCE: 'Content Intelligence',
  SECURITY_SENTINEL: 'Security Sentinel',
  GROWTH_STRATEGIST: 'Growth Strategist',
  ISSUE_FIXER: 'Issue Fixer',
};

function getAgentDisplayName(agentType: string): string {
  if (agentType in AGENT_NAMES) return AGENT_NAMES[agentType as AgentType];
  return agentType.replaceAll('_', ' ').replaceAll(/\b\w/g, c => c.toUpperCase());
}

const AGENT_COLORS: Record<AgentType, string> = {
  BUSINESS_ANALYST: 'from-blue-500 to-indigo-600',
  LEGAL_COMPLIANCE: 'from-purple-500 to-violet-600',
  UX_AGENT: 'from-emerald-500 to-teal-600',
  CONTENT_INTELLIGENCE: 'from-amber-500 to-orange-600',
  SECURITY_SENTINEL: 'from-red-500 to-rose-600',
  GROWTH_STRATEGIST: 'from-cyan-500 to-blue-600',
  ISSUE_FIXER: 'from-green-500 to-emerald-600',
};

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
};

export default function AIAgentsDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, insightsRes] = await Promise.all([
        fetch('/api/owner/agents/status'),
        fetch('/api/owner/agents/insights'),
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      } else {
        setAgents([]);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights || []);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAllAgents = async () => {
    setRunningAll(true);
    try {
      const res = await fetch('/api/owner/agents/run', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to run agents:', error);
    } finally {
      setRunningAll(false);
    }
  };

  const markAsRead = async (id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
    try {
      await fetch(`/api/owner/agents/insights/${id}/read`, { method: 'POST' });
    } catch {
      // Ignore errors
    }
  };

  const resolveInsight = async (id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isResolved: true } : i));
    try {
      await fetch(`/api/owner/agents/insights/${id}/resolve`, { method: 'POST' });
    } catch {
      // Ignore errors
    }
  };

  const filteredInsights = insights.filter(insight => {
    if (selectedAgent !== 'all' && insight.agentType !== selectedAgent) return false;
    if (selectedSeverity !== 'all' && insight.severity !== selectedSeverity) return false;
    return true;
  });

  const unreadCount = insights.filter(i => !i.isRead).length;
  const criticalCount = insights.filter(i => i.severity === 'critical' && !i.isResolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PremiumPageHeader
        title="AI Agents"
        subtitle="7 agents: 6 monitors + 1 auto-fixer for found issues"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'AI Agents' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                {criticalCount} critical
              </span>
            )}
            {unreadCount > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-medium">
                {unreadCount} unread
              </span>
            )}
            <PremiumButton
              onClick={fetchData}
              variant="secondary"
              icon={RefreshCw}
              size="sm"
            >
              Refresh
            </PremiumButton>
            <PremiumButton
              onClick={runAllAgents}
              disabled={runningAll}
              variant="primary"
              icon={Bot}
              loading={runningAll}
              size="sm"
            >
              {runningAll ? 'Running...' : 'Run All Agents'}
            </PremiumButton>
          </div>
        }
        gradient="from-violet-600 via-purple-600 to-pink-600"
      />

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => {
          const Icon = AGENT_ICONS[agent.type] ?? Bot;
          const color = AGENT_COLORS[agent.type] ?? 'from-slate-500 to-slate-600';

          return (
            <motion.div
              key={agent.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PremiumCard variant="glass" className="h-full p-5 hover:border-border/80 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${agent.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {agent.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {agent.schedule}
                </span>
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  {agent.insights24h} insights (24h)
                </span>
              </div>
              </PremiumCard>
            </motion.div>
          );
        })}
      </div>

      {/* Insights Feed */}
      <PremiumCard variant="glass" className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Insights Feed</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 flex flex-wrap gap-3"
              >
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value as AgentType | 'all')}
                  className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="all">All Agents</option>
                  {agents.map(a => (
                    <option key={a.type} value={a.type}>{a.name}</option>
                  ))}
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
                  className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="divide-y divide-border">
          {filteredInsights.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No insights yet. Run agents to generate insights.</p>
            </div>
          ) : (
            filteredInsights.map((insight) => {
              const config = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;
              const SeverityIcon = config.icon;
              const AgentIcon = AGENT_ICONS[insight.agentType] ?? Bot;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-muted/50 transition-colors ${!insight.isRead ? 'bg-violet-500/10' : ''} ${insight.isResolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <SeverityIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{insight.title}</span>
                        {insight.isResolved && (
                          <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Resolved</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <AgentIcon className="w-3 h-3" />
                          {getAgentDisplayName(insight.agentType)}
                        </span>
                        <span>{new Date(insight.createdAt).toLocaleString()}</span>
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!insight.isRead && (
                        <button
                          onClick={() => markAsRead(insight.id)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {!insight.isResolved && (
                        <button
                          onClick={() => resolveInsight(insight.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
