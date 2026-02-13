'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Database, AlertTriangle, CheckCircle, RefreshCw, Timer } from 'lucide-react';
import DeployTimeline from '@/components/owner/DeployTimeline';
import { PremiumCard, PremiumStatCard, PremiumGradientCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';

interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical';
  uptimeSeconds: number;
  dbLatencyMs: number;
  rateLimitTriggers: number;
  aiFailuresLast5m: number;
  dbLatencyHistory?: { at: string; value: number }[];
}

interface DeployEvent {
  id: string;
  version: string;
  gitCommit: string | null;
  changesSummary: string | null;
  status: string;
  environment: string;
  deployedAt: string;
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [deployEvents, setDeployEvents] = useState<DeployEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/owner/system-health').then((r) => r.json()),
      fetch('/api/owner/changelog').then((r) => r.json()),
    ])
      .then(([health, changelog]) => {
        setData(health);
        setDeployEvents(changelog?.events ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const statusConfig = {
    healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', icon: AlertTriangle },
  };
  const status = statusConfig[data.status] ?? statusConfig.healthy;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-8">
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="System Health"
        subtitle="DevOps-style monitoring with live data from DB & system metrics"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'System' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 bg-gray-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-border bg-card text-primary focus:ring-primary"
              />
              <Timer size={14} />
              Auto-refresh (30s)
            </label>
            <PremiumButton
              onClick={fetchData}
              disabled={loading}
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              size="sm"
            >
              Refresh
            </PremiumButton>
          </div>
        }
        gradient="from-cyan-500 via-blue-600 to-indigo-600"
      />

      {/* System Status Banner */}
      <PremiumGradientCard
        borderGradient={
          data.status === 'healthy'
            ? 'from-emerald-500 to-teal-500'
            : data.status === 'warning'
              ? 'from-amber-500 to-orange-500'
              : 'from-rose-500 to-red-500'
        }
      >
        <div className="flex items-center gap-4">
          <StatusIcon size={32} className={status.text} />
          <div>
            <p className="font-bold text-foreground">
              Status: {data.status.toUpperCase()}
            </p>
            <p className="text-muted-foreground text-sm">
              {data.status === 'healthy'
                ? 'All systems operational'
                : data.status === 'warning'
                  ? 'Some metrics need attention'
                  : 'Critical issues detected'}
            </p>
          </div>
        </div>
      </PremiumGradientCard>

      {/* System Metrics */}
      <PremiumSection
        title="System Metrics"
        subtitle="Real-time platform performance indicators"
        icon={Activity}
        gradient="from-emerald-500 to-teal-600"
      >
        <PremiumGrid cols={4}>
          <PremiumStatCard
            title="Process Uptime"
            value={`${Math.floor(data.uptimeSeconds / 3600)}h ${Math.floor((data.uptimeSeconds % 3600) / 60)}m`}
            icon={Activity}
            gradient="from-emerald-500 to-teal-600"
          />
          <PremiumStatCard
            title="DB Latency"
            value={`${data.dbLatencyMs}ms`}
            icon={Database}
            gradient="from-blue-500 to-indigo-600"
          />
          <PremiumStatCard
            title="Rate Limit Triggers (5m)"
            value={data.rateLimitTriggers.toString()}
            icon={AlertTriangle}
            gradient="from-amber-500 to-orange-600"
          />
          <PremiumStatCard
            title="AI Failures (5m)"
            value={data.aiFailuresLast5m.toString()}
            icon={AlertTriangle}
            gradient="from-rose-500 to-red-600"
          />
        </PremiumGrid>
      </PremiumSection>

      {/* DB Latency Trend */}
      {data.dbLatencyHistory && data.dbLatencyHistory.length > 1 && (
        <PremiumSection
          title="DB Latency Trend"
          subtitle="Last 24 samples from metrics collector"
          icon={Database}
          gradient="from-blue-500 to-indigo-600"
        >
          <PremiumCard variant="glass" className="p-6">
            <div className="flex items-end gap-0.5 h-24">
              {data.dbLatencyHistory.slice(-24).map((p, i) => {
                const max = Math.max(...data.dbLatencyHistory!.map((x) => x.value), 1);
                const h = Math.max(4, (p.value / max) * 80);
                return (
                  <div
                    key={i}
                    title={`${p.value}ms`}
                    className="flex-1 min-w-[4px] bg-blue-500/60 rounded-t transition-all hover:bg-blue-400"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </PremiumCard>
        </PremiumSection>
      )}

      {/* Deploy Timeline */}
      <PremiumSection
        title="Deploy Timeline"
        subtitle="Recent deployments and changes"
        icon={Activity}
        gradient="from-purple-500 to-pink-600"
      >
        <PremiumCard variant="glass" className="p-6">
          <DeployTimeline events={deployEvents} />
        </PremiumCard>
      </PremiumSection>
    </div>
  );
}
