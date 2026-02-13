'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Zap, Loader2, RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import { useTheme } from '@/app/theme-provider';
import {
  PremiumPageHeader,
  PremiumSection,
  PremiumCard,
  PremiumStatCard,
  PremiumGrid,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface ApiPerfData {
  slowest: { routePath: string; p95: number; avgTime: number; totalReqs: number }[];
  byRoute: { routePath: string; p50: number; p95: number; p99: number; errorRate: number; totalReqs: number }[];
}

export default function ApiPerformancePage() {
  const { theme } = useTheme();
  const [data, setData] = useState<ApiPerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/owner/api-performance?days=${daysBack}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [daysBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDark = theme === 'dark';
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const chartAxis = isDark ? '#94a3b8' : '#64748b';
  const chartTooltipBg = isDark ? '#1e293b' : '#ffffff';
  const chartTooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const avgResp = data?.byRoute?.length
    ? data.byRoute.reduce((s, r) => s + r.p50, 0) / data.byRoute.length
    : 0;
  const p95Overall = data?.slowest?.[0]?.p95 ?? 0;
  const errorRate = data?.byRoute?.length
    ? data.byRoute.reduce((s, r) => s + r.errorRate, 0) / data.byRoute.length
    : 0;
  const throughput = data?.byRoute?.reduce((s, r) => s + r.totalReqs, 0) ?? 0;

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="API Performance"
        subtitle="Response times, error rates, and throughput by endpoint"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'API Performance' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              {[
                { label: 'Last 24h', value: 1 },
                { label: '3 days', value: 3 },
                { label: '7 days', value: 7 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDaysBack(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    daysBack === option.value
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
        gradient="from-cyan-600 via-blue-600 to-indigo-600"
      />

      <PremiumGrid cols={4}>
        <PremiumStatCard
          title="Avg Response"
          value={`${Math.round(avgResp)}ms`}
          icon={Activity}
          gradient="from-emerald-500 to-teal-600"
        />
        <PremiumStatCard
          title="P95 Latency"
          value={`${Math.round(p95Overall)}ms`}
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-600"
        />
        <PremiumStatCard
          title="Error Rate"
          value={`${errorRate.toFixed(2)}%`}
          icon={AlertTriangle}
          gradient={errorRate > 1 ? 'from-rose-500 to-red-600' : 'from-emerald-500 to-teal-600'}
        />
        <PremiumStatCard
          title="Throughput"
          value={`${throughput.toLocaleString()} req`}
          icon={Zap}
          gradient="from-violet-500 to-purple-600"
        />
      </PremiumGrid>

      <PremiumSection
        title="Slowest Endpoints (P95)"
        subtitle="Endpoints ranked by 95th percentile response time"
        icon={AlertTriangle}
        gradient="from-amber-500 to-orange-600"
      >
        <PremiumCard variant="glass">
          {(data?.slowest?.length ?? 0) === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No API performance data yet</p>
              <p className="text-xs mt-1">Routes using withApiHandler are logged automatically when called</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.slowest ?? []} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={chartAxis} tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v) => `${v}ms`} />
                  <YAxis
                    type="category"
                    dataKey="routePath"
                    stroke={chartAxis}
                    width={110}
                    tick={{ fill: 'currentColor', fontSize: 10 }}
                    tickFormatter={(v) => (v?.length > 25 ? String(v).slice(0, 25) + '…' : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      border: `1px solid ${chartTooltipBorder}`,
                      borderRadius: '0.75rem',
                    }}
                    formatter={(value: number, _name: string, props: { payload: { routePath: string; totalReqs: number } }) => [
                      `${value}ms`,
                      props.payload.routePath,
                    ]}
                  />
                  <Bar dataKey="p95" name="P95 (ms)" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PremiumCard>
      </PremiumSection>
    </div>
  );
}
