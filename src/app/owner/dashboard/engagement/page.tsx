'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Users, Clock, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { useTheme } from '@/app/theme-provider';
import { PremiumCard, PremiumStatCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';

interface EngagementData {
  error?: string;
  mostUsedFeatures: { name: string; count: number }[];
  mostFrequentUsers: { userId: string; count: number; email: string | null }[];
  engagementTrend: { date: string; count: number }[];
  avgSessionDuration: number;
  uniqueUsersCount: number;
  returningUsersCount: number;
  newUsersCount: number;
  peakUsageHeatmap: { hour: number; count: number }[];
  totalEvents: number;
  hours: number;
}

const RANGE_OPTIONS = [
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
  { value: '8760', label: '365 days' },
] as const;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function EngagementPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState('720');

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/owner/engagement?hours=${hours}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || body?.error) {
          return {
            error: body?.error ?? 'Failed to load',
            mostUsedFeatures: [],
            mostFrequentUsers: [],
            engagementTrend: [],
            peakUsageHeatmap: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
            uniqueUsersCount: 0,
            returningUsersCount: 0,
            newUsersCount: 0,
            avgSessionDuration: 0,
            totalEvents: 0,
            hours: Number(hours) || 720,
          };
        }
        return {
          ...body,
          mostUsedFeatures: body.mostUsedFeatures ?? [],
          mostFrequentUsers: body.mostFrequentUsers ?? [],
          engagementTrend: body.engagementTrend ?? [],
          peakUsageHeatmap: body.peakUsageHeatmap ?? Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
        };
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        setData({
          error: 'Network error',
          mostUsedFeatures: [],
          mostFrequentUsers: [],
          engagementTrend: [],
          peakUsageHeatmap: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
          uniqueUsersCount: 0,
          returningUsersCount: 0,
          newUsersCount: 0,
          avgSessionDuration: 0,
          totalEvents: 0,
          hours: Number(hours) || 720,
        });
      })
      .finally(() => setLoading(false));
  }, [hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDark = theme === 'dark';
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const chartAxis = '#64748b';
  const chartTooltipBg = isDark ? '#1e293b' : '#ffffff';
  const chartTooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const maxPeak = Math.max(...(data?.peakUsageHeatmap?.map((h) => h.count) ?? [1]), 1);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === hours)?.label ?? '30 days';

  if (data.error && data.uniqueUsersCount === 0 && data.mostUsedFeatures?.length === 0) {
    return (
      <div className="space-y-8">
        <PremiumPageHeader
          title="User Engagement"
          subtitle="Feature usage and session analytics"
          breadcrumbs={[
            { label: 'Owner', href: '/owner' },
            { label: 'Dashboard', href: '/owner/dashboard' },
            { label: 'Engagement' }
          ]}
          gradient="from-blue-600 via-indigo-600 to-purple-600"
        />
        <PremiumCard variant="gradient" className="border-amber-500/30 bg-amber-500/10">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Unable to load data</p>
          <p className="text-muted-foreground text-sm mt-1">{data.error}</p>
          <PremiumButton onClick={fetchData} variant="secondary" className="mt-4">
            <RefreshCw className="w-4 h-4" />
            Retry
          </PremiumButton>
        </PremiumCard>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="User Engagement"
        subtitle="Feature usage, most active users, and session analytics"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Engagement' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              {RANGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setHours(o.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hours === o.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <PremiumButton onClick={fetchData} variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PremiumButton>
          </div>
        }
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      {/* Key Metrics */}
      <motion.div variants={item}>
        <PremiumGrid cols={3}>
          <PremiumStatCard
            title={`Unique Users (${rangeLabel})`}
            value={data.uniqueUsersCount.toString()}
            icon={<Users className="w-6 h-6" />}
            gradient="from-blue-500 to-indigo-600"
          />
          <PremiumStatCard
            title="Returning vs New"
            value={`${data.returningUsersCount} / ${data.newUsersCount}`}
            icon={<Users className="w-6 h-6" />}
            gradient="from-emerald-500 to-teal-600"
          />
          <PremiumStatCard
            title="Avg Session"
            value={data.avgSessionDuration > 0 ? `${data.avgSessionDuration}m` : 'N/A'}
            icon={<Clock className="w-6 h-6" />}
            gradient="from-purple-500 to-pink-600"
          />
        </PremiumGrid>
      </motion.div>

      {/* Engagement trend over time */}
      <motion.div variants={item}>
        <PremiumSection
          title="Engagement Over Time"
          subtitle="Track user activity trends"
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="from-emerald-500 to-teal-600"
        >
          <PremiumCard variant="glass" className="p-6">
            <div className="h-56">
          {(data.engagementTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.engagementTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis
                  dataKey="date"
                  stroke={chartAxis}
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  tickFormatter={(v) => (v?.length >= 10 ? v.slice(5) : v)}
                />
                <YAxis stroke={chartAxis} tick={{ fill: 'currentColor', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '0.75rem',
                  }}
                  labelFormatter={(v) => v}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingUp className="w-14 h-14 mb-3 opacity-40" />
              <p className="text-sm font-medium">No engagement data yet</p>
            </div>
          )}
          </div>
          </PremiumCard>
        </PremiumSection>
      </motion.div>

      {/* Feature Usage & Top Users */}
      <motion.div variants={item}>
        <PremiumGrid cols={2}>
          {/* All features - full list */}
          <PremiumCard variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                All Features ({data.mostUsedFeatures?.length ?? 0})
              </h2>
            </div>
            <div className="h-80 min-h-[320px]">
            {(data.mostUsedFeatures?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.mostUsedFeatures ?? []}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={chartAxis} tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={chartAxis}
                    width={90}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      border: `1px solid ${chartTooltipBorder}`,
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#10b981">
                    {(data.mostUsedFeatures ?? []).map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="w-16 h-16 mb-3 opacity-40" />
                <p className="text-sm font-medium">No feature usage yet</p>
              </div>
            )}
            </div>
          </PremiumCard>

          {/* Most frequent users */}
          <PremiumCard variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Most Frequent Users
              </h2>
            </div>
            <div className="h-80 min-h-[320px] overflow-auto">
            {(data.mostFrequentUsers?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(data.mostFrequentUsers ?? []).map((u) => ({
                    name: u.email ? u.email.split('@')[0] : u.userId.slice(0, 8),
                    count: u.count,
                    email: u.email,
                  }))}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={chartAxis} tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={chartAxis}
                    width={100}
                    tick={{ fill: 'currentColor', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      border: `1px solid ${chartTooltipBorder}`,
                      borderRadius: '0.75rem',
                    }}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.email ?? label
                    }
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Zap className="w-16 h-16 mb-3 opacity-40" />
                <p className="text-sm font-medium">No user activity yet</p>
              </div>
            )}
            </div>
          </PremiumCard>
        </PremiumGrid>
      </motion.div>

      {/* Peak usage heatmap */}
      <motion.div variants={item}>
        <PremiumSection
          title="Peak Usage by Hour"
          subtitle="24-hour activity heatmap"
          icon={<Clock className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
        >
          <PremiumCard variant="glass" className="p-6">
        <div className="grid grid-cols-12 gap-1 sm:gap-2">
          {data.peakUsageHeatmap.map((h, i) => (
            <motion.div
              key={h.hour}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center border border-border/50 ${
                h.count > 0 ? '' : 'bg-muted/40'
              }`}
              style={
                h.count > 0
                  ? { backgroundColor: `rgba(16, 185, 129, ${0.12 + (h.count / maxPeak) * 0.55})` }
                  : undefined
              }
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-[10px] text-muted-foreground">{h.hour}</span>
              <span className="text-xs font-semibold text-foreground">{h.count}</span>
            </motion.div>
          ))}
          </div>
          </PremiumCard>
        </PremiumSection>
      </motion.div>
    </motion.div>
  );
}
