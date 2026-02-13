'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, BarChart3, Hash } from 'lucide-react';
import { useTheme } from '@/app/theme-provider';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';

interface GrowthData {
  range: string;
  dailySignups: { date: string; count: number }[];
  monthlySignups: { date: string; count: number }[];
  yearlySignups: { date: string; count: number }[];
  weeklySignups: { date: string; count: number }[];
  activeCategories: { name: string; count: number }[];
  popularKeywords: { query: string; count: number }[];
}

const RANGE_OPTIONS = [
  { value: 'day', label: 'Daily (30 days)' },
  { value: 'month', label: 'Monthly (12 months)' },
  { value: 'year', label: 'Yearly (24 months)' },
] as const;

export default function GrowthPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'day' | 'month' | 'year'>('day');

  const isDark = theme === 'dark';
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const chartAxis = '#64748b';
  const chartTooltipBg = isDark ? '#1e293b' : '#ffffff';
  const chartTooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/owner/growth?range=${range}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) {
          const msg = body?.detail || body?.error || r.statusText;
          return Promise.reject(new Error(msg));
        }
        return body;
      })
      .then((body) => {
        if (body?.error) {
          setError(body.error);
          return;
        }
        setData({
          range: body.range ?? range,
          dailySignups: body.dailySignups ?? [],
          monthlySignups: body.monthlySignups ?? [],
          yearlySignups: body.yearlySignups ?? [],
          weeklySignups: body.weeklySignups ?? [],
          activeCategories: body.activeCategories ?? [],
          popularKeywords: body.popularKeywords ?? [],
        });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load growth data');
      })
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PremiumPageHeader
          title="Growth & Product Insights"
          subtitle="Signups, categories, and search trends"
          breadcrumbs={[
            { label: 'Owner', href: '/owner' },
            { label: 'Dashboard', href: '/owner/dashboard' },
            { label: 'Growth' }
          ]}
          gradient="from-emerald-500 via-teal-500 to-cyan-600"
        />
        <PremiumCard variant="gradient" className="border-amber-500/30 bg-amber-500/10">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Unable to load data</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </PremiumCard>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const chartData =
    range === 'day'
      ? data.dailySignups
      : range === 'month'
        ? data.monthlySignups
        : data.yearlySignups;

  return (
    <div className="space-y-8">
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="Growth & Product Insights"
        subtitle="Track signups, analyze trends, and monitor user behavior over time"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Growth' }
        ]}
        actions={
          <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setRange(o.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  range === o.value
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar size={14} />
                {o.label}
              </button>
            ))}
          </div>
        }
        gradient="from-emerald-500 via-teal-500 to-cyan-600"
      />

      {/* No Data Message */}
      {((data.dailySignups?.length ?? 0) === 0 &&
        (data.monthlySignups?.length ?? 0) === 0 &&
        (data.activeCategories?.length ?? 0) === 0 &&
        (data.popularKeywords?.length ?? 0) === 0) && (
        <PremiumCard variant="gradient" className="text-center">
          <p className="text-muted-foreground">
            No activity yet. Data will appear as users sign up, create posts, and run searches.
          </p>
        </PremiumCard>
      )}

      {/* User Signups Chart */}
      <PremiumSection
        title={`User Signups — ${RANGE_OPTIONS.find((o) => o.value === range)?.label}`}
        subtitle="Track new user registrations over time"
        icon={TrendingUp}
        gradient="from-emerald-500 to-teal-600"
      >
        <PremiumCard variant="glass" className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
            {range === 'day' ? (
              <LineChart data={chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis
                  dataKey="date"
                  stroke={chartAxis}
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickFormatter={(v) => (v?.length >= 10 ? String(v).slice(5) : v)}
                />
                <YAxis stroke={chartAxis} tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '0.75rem',
                  }}
                  labelFormatter={(v) => v}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={chartAxis}
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickFormatter={(v) => (v?.length >= 7 ? String(v).slice(0, 7) : v)}
                />
                <YAxis stroke={chartAxis} tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        </PremiumCard>
      </PremiumSection>

      {/* Analytics Grid */}
      <PremiumGrid cols={2}>
        <PremiumCard variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Most Active Categories</h2>
          </div>
          {(data.activeCategories ?? []).length === 0 ? (
            <p className="text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-3">
              {(data.activeCategories ?? []).map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-primary font-mono font-medium">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
        <PremiumCard variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Hash className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Popular Search Keywords</h2>
          </div>
          {(data.popularKeywords ?? []).length === 0 ? (
            <p className="text-muted-foreground">No searches yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data.popularKeywords ?? []).slice(0, 20).map((k, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-muted text-foreground text-sm"
                >
                  {k.query} ({k.count})
                </span>
              ))}
            </div>
          )}
        </PremiumCard>
      </PremiumGrid>
    </div>
  );
}
