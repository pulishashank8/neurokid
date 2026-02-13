'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Legend,
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/app/theme-provider';
import { PremiumCard, PremiumStatCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';

interface BusinessMetrics {
  revenue?: { date: string; amount: number }[];
  users?: { date: string; count: number }[];
  engagement?: { date: string; score: number }[];
  conversion?: { date: string; rate: number }[];
  totalRevenue?: number;
  avgRevenuePerUser?: number;
  monthlyGrowthRate?: number;
  churnRate?: number;
}

interface BusinessData {
  metrics: BusinessMetrics;
  computed?: boolean;
  error?: string;
}

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const DAYS_OPTIONS = [
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
  { value: '180', label: '180 Days' },
  { value: '365', label: '1 Year' },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function BusinessIntelligencePage() {
  const { theme } = useTheme();
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [daysBack, setDaysBack] = useState('90');

  const fetchData = useCallback(async (compute = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        days: daysBack,
        ...(compute ? { compute: 'true' } : {}),
      });
      
      const res = await fetch(`/api/owner/business?${params}`);
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to load business metrics');
      }
      
      setData(body);
    } catch (err) {
      console.error('[BI Dashboard] Error:', err);
      setData({
        metrics: {},
        error: err instanceof Error ? err.message : 'Failed to load data',
      });
    } finally {
      setLoading(false);
      setComputing(false);
    }
  }, [period, daysBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompute = async () => {
    setComputing(true);
    await fetchData(true);
  };

  const isDark = theme === 'dark';
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const chartAxis = '#64748b';
  const chartTooltipBg = isDark ? '#1e293b' : '#ffffff';
  const chartTooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const metrics = data?.metrics ?? {};

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <PremiumPageHeader
        title="Business Intelligence"
        subtitle="Revenue, growth, and key business metrics"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Analytics', href: '/owner/dashboard/analytics' },
          { label: 'Business' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              {PERIOD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setPeriod(o.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === o.value
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              {DAYS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setDaysBack(o.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    daysBack === o.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <PremiumButton
              onClick={handleCompute}
              disabled={computing}
              variant="success"
              size="sm"
              loading={computing}
            >
              {computing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Compute
                </>
              )}
            </PremiumButton>
          </div>
        }
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
      />

      {data?.error && (
        <PremiumCard variant="gradient" className="border-amber-500/30 bg-amber-500/10">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Unable to load data</p>
          <p className="text-muted-foreground text-sm mt-1">{data.error}</p>
        </PremiumCard>
      )}

      {/* Key Business Metrics */}
      <motion.div variants={item}>
        <PremiumGrid cols={4}>
          <PremiumStatCard
            title="Total Revenue"
            value={metrics.totalRevenue ? `$${metrics.totalRevenue.toLocaleString()}` : '$0'}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="from-emerald-500 to-teal-600"
          />
          <PremiumStatCard
            title="Avg Revenue/User"
            value={metrics.avgRevenuePerUser ? `$${metrics.avgRevenuePerUser.toFixed(2)}` : '$0'}
            icon={<Target className="w-6 h-6" />}
            gradient="from-blue-500 to-indigo-600"
          />
          <PremiumStatCard
            title="Monthly Growth"
            value={metrics.monthlyGrowthRate ? `${(metrics.monthlyGrowthRate * 100).toFixed(1)}%` : '0%'}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="from-purple-500 to-pink-600"
          />
          <PremiumStatCard
            title="Churn Rate"
            value={metrics.churnRate ? `${(metrics.churnRate * 100).toFixed(1)}%` : '0%'}
            icon={<Users className="w-6 h-6" />}
            gradient="from-orange-500 to-red-600"
          />
        </PremiumGrid>
      </motion.div>

      {/* Revenue Trend */}
      {metrics.revenue && metrics.revenue.length > 0 && (
        <motion.div variants={item}>
          <PremiumSection
            title="Revenue Trend"
            subtitle="Track revenue over time"
            icon={<DollarSign className="w-5 h-5" />}
            gradient="from-emerald-500 to-teal-600"
          >
            <PremiumCard variant="glass" className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '0.75rem',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </PremiumSection>
        </motion.div>
      )}

      {/* User Growth */}
      {metrics.users && metrics.users.length > 0 && (
        <motion.div variants={item}>
          <PremiumSection
            title="User Growth"
            subtitle="New user signups over time"
            icon={<Users className="w-5 h-5" />}
            gradient="from-blue-500 to-indigo-600"
          >
            <PremiumCard variant="glass" className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.users}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '0.75rem',
                      }}
                      formatter={(value: number) => [value, 'New Users']}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </PremiumSection>
        </motion.div>
      )}

      {/* Engagement Score */}
      {metrics.engagement && metrics.engagement.length > 0 && (
        <motion.div variants={item}>
          <PremiumSection
            title="Engagement Score"
            subtitle="User activity and interaction metrics"
            icon={<BarChart3 className="w-5 h-5" />}
            gradient="from-purple-500 to-pink-600"
          >
            <PremiumCard variant="glass" className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.engagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '0.75rem',
                      }}
                      formatter={(value: number) => [value.toFixed(2), 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </PremiumSection>
        </motion.div>
      )}

      {/* Conversion Rate */}
      {metrics.conversion && metrics.conversion.length > 0 && (
        <motion.div variants={item}>
          <PremiumSection
            title="Conversion Rate"
            subtitle="Track user conversion over time"
            icon={<Target className="w-5 h-5" />}
            gradient="from-orange-500 to-red-600"
          >
            <PremiumCard variant="glass" className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.conversion}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={chartAxis}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '0.75rem',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversion']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </PremiumSection>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && (!metrics.revenue || metrics.revenue.length === 0) && (
        <motion.div variants={item}>
          <PremiumCard variant="gradient" className="border-blue-500/30 bg-blue-500/10">
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Business Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Click &quot;Compute&quot; to calculate business intelligence metrics from your platform data.
              </p>
              <PremiumButton
                onClick={handleCompute}
                disabled={computing}
                variant="success"
                loading={computing}
              >
                {computing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Compute Metrics
                  </>
                )}
              </PremiumButton>
            </div>
          </PremiumCard>
        </motion.div>
      )}
    </motion.div>
  );
}
