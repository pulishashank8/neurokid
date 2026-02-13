'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cpu, Zap, AlertCircle, RefreshCw, Database, Timer, Download } from 'lucide-react';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';
import { PremiumCard, PremiumStatCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';

type TimeRange = '24h' | '7d' | '30d' | '365d';

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '365d': 'Last year',
};

interface AIUsageData {
  totalRequests: number;
  failedCalls: number;
  avgResponseTimeMs: number;
  tokenEstimate: number;
  tokenEstimateFromFallback?: boolean;
  dailyUsageFromFallback?: boolean;
  mostUsedFeatures: { feature: string; count: number }[];
  p95ResponseTimeMs?: number;
  slowRequestCount?: number;
  weeklySummary?: string;
  dailyUsage?: { date: string; label?: string; count: number; tokens: number }[];
  range?: TimeRange;
}

function formatFeatureName(feature: string): string {
  if (feature.startsWith('ai_agent_')) {
    return `AI Agent: ${feature.replace('ai_agent_', '').replaceAll('_', ' ')}`;
  }
  const map: Record<string, string> = {
    ai_chat: 'AI Chat (Support)',
    storytelling: 'Storytelling',
    advisor: 'Business Advisor',
    navigator_chat: 'Navigator Chat',
  };
  return map[feature] ?? feature;
}

export default function AIUsagePage() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [range, setRange] = useState<TimeRange>('7d');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/owner/ai-usage?range=${range}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load AI usage data');
        return r.json();
      })
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        setError(null);
      })
      .catch((err) => {
        console.error('[AI Usage]', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const handleBackfill = () => {
    setBackfilling(true);
    fetch('/api/owner/ai-usage/backfill?days=365', { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) fetchData();
      })
      .catch(console.error)
      .finally(() => setBackfilling(false));
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading AI usage data…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">AI Usage & Performance</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-foreground mb-2">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rangeLabel = RANGE_LABELS[range] || RANGE_LABELS['7d'];

  const cards = [
    {
      label: `Total Requests (${rangeLabel})`,
      value: data.totalRequests,
      icon: Cpu,
      color: 'emerald',
    },
    {
      label: 'Failed Calls',
      value: data.failedCalls,
      icon: AlertCircle,
      color: data.failedCalls > 0 ? 'red' : 'slate',
    },
    {
      label: 'Avg Response Time',
      value: `${data.avgResponseTimeMs}ms`,
      icon: Zap,
      color: 'blue',
    },
    {
      label: 'Tokens Used',
      value: data.tokenEstimateFromFallback
        ? `~${(data.tokenEstimate ?? 0).toLocaleString()} (est.)`
        : (data.tokenEstimate ?? 0).toLocaleString(),
      icon: Cpu,
      color: 'violet',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Usage & Performance</h1>
          <p className="text-muted-foreground mt-1">
            Aggregates: AI Chat, Storytelling, AI Agents, Business Advisor, Navigator Chat · Data from AIUsageLog + completed jobs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(['24h', '7d', '30d', '365d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === '24h' ? '24h' : r === '7d' ? '7d' : r === '30d' ? '30d' : '1y'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-border bg-secondary"
            />
            <Timer size={14} />
            Auto-refresh
          </label>
          <a
            href="/api/owner/export?type=ai-usage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors duration-300"
          >
            <Download size={16} />
            Export
          </a>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent/50 disabled:opacity-50 transition-colors duration-500"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {(data.dailyUsageFromFallback || (data.totalRequests > 0 && data.tokenEstimateFromFallback)) && (
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Database size={16} className={backfilling ? 'animate-spin' : ''} />
              {backfilling ? 'Backfilling...' : 'Backfill last 365 days'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                c.color === 'emerald'
                  ? 'bg-emerald-500/20'
                  : c.color === 'red'
                    ? 'bg-red-500/20'
                    : c.color === 'blue'
                      ? 'bg-blue-500/20'
                      : 'bg-violet-500/20'
              }`}
            >
              <c.icon
                size={24}
                className={
                  c.color === 'emerald'
                    ? 'text-emerald-400'
                    : c.color === 'red'
                      ? 'text-red-400'
                      : c.color === 'blue'
                        ? 'text-blue-400'
                        : 'text-violet-400'
                }
              />
            </div>
            <p className="text-muted-foreground text-sm">{c.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 transition-colors duration-500 ease-out">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <Zap size={20} className="text-emerald-400" />
          AI Weekly Summary
        </h2>
        <p className="text-foreground text-sm leading-relaxed">
          {data.weeklySummary || 'No summary available yet. Start using AI chat to see metrics.'}
        </p>
          {(data.p95ResponseTimeMs ?? 0) > 5000 && (
            <p className="text-amber-400 text-sm mt-2">
              Slow responses detected: p95 at {(data.p95ResponseTimeMs! / 1000).toFixed(1)}s
            </p>
          )}
          {data.slowRequestCount && data.slowRequestCount > 0 && (
            <p className="text-amber-400 text-sm mt-2">
              {data.slowRequestCount} requests exceeded 5s response time
            </p>
          )}
        </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out">
        <h2 className="text-lg font-bold text-foreground mb-4">Most Used AI Features</h2>
        {data.mostUsedFeatures.length === 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground">No AI usage recorded yet</p>
            <p className="text-muted-foreground text-sm">
              Data is stored from: AI Chat (support), Storytelling, AI Agents (cron + manual), Business Advisor, Navigator Chat. Run <strong>Backfill last 365 days</strong> above to migrate historical AI job data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.mostUsedFeatures.map((f) => (
              <div key={f.feature} className="flex items-center justify-between">
                <span className="text-foreground">{formatFeatureName(f.feature)}</span>
                <span className="font-mono text-emerald-400">{f.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(data.dailyUsage?.length ?? 0) > 0 && (
        <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">AI Usage ({rangeLabel})</h2>
            {data.dailyUsageFromFallback && (
              <span className="text-xs text-muted-foreground bg-amber-500/10 text-amber-600 px-2 py-1 rounded" title="Request counts are real (from completed AI jobs). Token counts are estimated.">
                Request counts from completed jobs · Tokens estimated
              </span>
            )}
          </div>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {data.dailyUsage!.map((d) => {
              const maxCount = Math.max(...data.dailyUsage!.map((x) => x.count), 1);
              const barHeightPct = maxCount > 0 ? Math.max(6, (d.count / maxCount) * 100) : 6;
              const displayLabel = d.label ?? d.date.slice(5);
              return (
                <div key={d.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex flex-col justify-end min-h-[64px]">
                    <div
                      className="w-full bg-primary/70 rounded-t transition-all hover:bg-primary min-h-[4px]"
                      style={{ height: `${barHeightPct}%` }}
                      title={`${d.count} requests${d.tokens ? `, ${d.tokens.toLocaleString()} tokens` : ''}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums" title={`${d.count} requests`}>
                    {d.count}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">{displayLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span><span className="w-2 h-2 inline-block bg-primary rounded mr-1" />Requests per {range === '24h' ? 'hour' : range === '365d' ? 'month' : 'day'}</span>
          </div>
          {data.totalRequests === 0 && (
            <p className="text-muted-foreground text-sm mt-3">
              No AI usage in this period. Usage is logged from chat, stories, agents, advisor, and navigator.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
