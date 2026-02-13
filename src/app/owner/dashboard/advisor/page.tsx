'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, Users, Shield, Cpu, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface AdvisorData {
  growthHealth: string;
  engagementInsight: string;
  riskAlerts: string[];
  aiStatus: string;
  recommendedActions: string[];
  generatedAt?: string;
  fromCache?: boolean;
  isFallback?: boolean;
}

interface AdvisorError {
  error: string;
  userMessage?: string;
  details?: string;
}

export default function AdvisorPage() {
  const [data, setData] = useState<AdvisorData | null>(null);
  const [error, setError] = useState<AdvisorError | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdvisor = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? '/api/owner/advisor?refresh=1' : '/api/owner/advisor';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError({
          error: json.error ?? 'Request failed',
          userMessage: json.userMessage ?? json.details ?? 'Could not load advisor summary.',
          details: json.details,
        });
        setData(null);
        return;
      }
      setData(json);
      setError(null);
    } catch (err) {
      setError({
        error: 'Network error',
        userMessage: 'Failed to connect. Check your network and try again.',
        details: err instanceof Error ? err.message : String(err),
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisor(false);
  }, [fetchAdvisor]);

  if (loading && !data && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Analyzing platform metrics… This may take 30–60 seconds.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Business Advisor</h1>
          <p className="text-muted-foreground mt-1">Weekly summaries and recommended actions</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={24} />
            <h2 className="text-lg font-bold">Advisor unavailable</h2>
          </div>
          <p className="text-foreground">{error.userMessage ?? error.error}</p>
          <button
            onClick={() => fetchAdvisor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors w-fit"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Growth Health',
      content: data.growthHealth,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Engagement Insights',
      content: data.engagementInsight,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Risk Alerts',
      content: data.riskAlerts.join(' '),
      icon: Shield,
      color: data.riskAlerts.some((r) => r.includes('anomal') || r.includes('churn'))
        ? 'amber'
        : 'emerald',
    },
    {
      title: 'AI System Status',
      content: data.aiStatus,
      icon: Cpu,
      color: 'violet',
    },
  ];

  const lastUpdated = data.generatedAt
    ? formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Business Advisor</h1>
          <p className="text-muted-foreground mt-1">
            Weekly summaries and recommended actions
            {lastUpdated && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Last updated {lastUpdated}
                {data.fromCache && ' (cached)'}
                {data.isFallback && ' — using fallback due to analysis failure'}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchAdvisor(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50 w-fit"
          title="Refresh to get latest analysis"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <div
            key={c.title}
            className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out"
          >
            <div className="flex items-center gap-2 mb-3">
              <c.icon
                size={20}
                className={
                  c.color === 'emerald'
                    ? 'text-emerald-400'
                    : c.color === 'blue'
                      ? 'text-blue-400'
                      : c.color === 'amber'
                        ? 'text-amber-400'
                        : 'text-violet-400'
                }
              />
              <h2 className="text-lg font-bold text-foreground">{c.title}</h2>
            </div>
            <p className="text-foreground text-sm">{c.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 transition-colors duration-500 ease-out">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-emerald-400" />
          Recommended Actions
        </h2>
        <ul className="space-y-2">
          {data.recommendedActions.map((action, i) => (
            <li key={i} className="text-foreground text-sm flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
