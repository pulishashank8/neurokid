'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormattedDate } from '@/components/shared/FormattedDate';
import { Sparkles, BarChart3, Activity, Zap, Users as UsersIcon, Clock, Download } from 'lucide-react';
import Link from 'next/link';
import KPICard from '@/features/owner/KPICard';
import { DashboardKPIBar } from '@/features/owner/KPIBar';
import MetricsDonutPanel from '@/features/owner/MetricsDonutPanel';
import PerformanceChart from '@/features/owner/PerformanceChart';
import StatusSummary from '@/features/owner/StatusSummary';
import ReportSummary from '@/features/owner/ReportSummary';
import RealtimeEventFeed from '@/features/owner/RealtimeEventFeed';
import ChurnRiskWidget from '@/features/owner/ChurnRiskWidget';
import QuickActions from '@/features/owner/QuickActions';
import TodoWidget from '@/features/owner/TodoWidget';
import DailyBriefing from '@/features/owner/DailyBriefing';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';

const kpiConfig: Array<{
  key: string;
  title: string;
  changeKey?: string;
  subtitle?: string;
  valueSuffix?: string;
  iconName: string;
  gradient: string;
  glow: string;
  chartColor: string;
  sparkKey: 'users' | 'active' | 'value';
  forecastKey?: keyof { activeUsers7d: number[]; newSignups: number[]; aiUsage: number[] };
}> = [
  {
    key: 'totalUsers',
    title: 'Total Users',
    changeKey: undefined,
    iconName: 'Users',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/20',
    chartColor: '#6366f1',
    sparkKey: 'users' as const,
  },
  {
    key: 'activeUsers7d',
    title: 'Active Users (7d)',
    changeKey: 'activeUsers7d',
    subtitle: 'Logged in last 7 days',
    iconName: 'Activity',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    chartColor: '#10b981',
    sparkKey: 'active' as const,
    forecastKey: 'activeUsers7d',
  },
  {
    key: 'newSignupsToday',
    title: 'New Signups Today',
    changeKey: undefined,
    iconName: 'TrendingUp',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    chartColor: '#8b5cf6',
    sparkKey: 'users' as const,
    forecastKey: 'newSignups',
  },
  {
    key: 'aiUsage7d',
    title: 'AI Usage (7d)',
    changeKey: 'aiUsage',
    subtitle: 'AI requests last 7 days',
    iconName: 'Cpu',
    gradient: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/20',
    chartColor: '#d946ef',
    sparkKey: 'value' as const,
    forecastKey: 'aiUsage',
  },
  {
    key: 'dauMauRatio',
    title: 'DAU/MAU Ratio',
    changeKey: undefined,
    subtitle: 'Stickiness indicator',
    valueSuffix: '%',
    iconName: 'Activity',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/20',
    chartColor: '#06b6d4',
    sparkKey: 'active' as const,
  },
  {
    key: 'totalPosts',
    title: 'Total Posts',
    changeKey: 'totalPosts',
    iconName: 'FileText',
    gradient: 'from-orange-500 to-red-600',
    glow: 'shadow-orange-500/20',
    chartColor: '#f97316',
    sparkKey: 'users' as const,
  },
  {
    key: 'totalMessagesSent',
    title: 'Total Messages',
    changeKey: 'totalMessages',
    iconName: 'MessageSquare',
    gradient: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/20',
    chartColor: '#f43f5e',
    sparkKey: 'users' as const,
  },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<any>(null);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Fetch dashboard data - middleware already handles auth redirect
    Promise.all([
      fetch('/api/owner/kpis').then((r) => r.json()),
      fetch('/api/owner/recent-logins').then((r) => r.json()),
    ])
      .then(([kpisData, loginsData]) => {
        if (kpisData.error === 'Unauthorized' || kpisData.error === 'Forbidden') {
          router.push('/owner/login');
          return;
        }
        setKpis(kpisData);
        setRecentLogins(loginsData.recentLogins || []);
        setAuthChecked(true);
      })
      .catch((err) => {
        console.error('Dashboard data fetch error:', err);
        router.push('/owner/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  const sparkData = kpis.sparkData ?? [];

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 px-0 sm:px-2 space-y-8">
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="Dashboard Overview"
        subtitle="Monitor your platform health, performance, and growth in real-time"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard' }
        ]}
        actions={
          <div className="flex gap-2">
            <PremiumButton variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </PremiumButton>
            <Link href="/owner/dashboard/cofounder-reports">
              <PremiumButton variant="luxury" glow size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Co-Founder AI
              </PremiumButton>
            </Link>
          </div>
        }
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      {/* Daily Briefing */}
      <DailyBriefing />

      {/* KPI Bar - Compact horizontal metrics */}
      <PremiumSection
        title="Real-Time Metrics"
        subtitle="Live platform performance indicators"
        gradient="from-emerald-500 to-teal-600"
      >
        <DashboardKPIBar
          totalUsers={kpis.totalUsers}
          activeUsers={kpis.activeUsers7d}
          activeUsersChange={kpis.changes?.activeUsers7d}
          newToday={kpis.newSignupsToday}
          aiUsage={kpis.aiUsage7d}
          aiUsageChange={kpis.changes?.aiUsage}
          postsCount={kpis.totalPosts}
          postsChange={kpis.changes?.totalPosts}
          messagesCount={kpis.totalMessagesSent}
          messagesChange={kpis.changes?.totalMessages}
          dauMauRatio={kpis.dauMauRatio}
        />
      </PremiumSection>

      {/* Donut Charts - Distribution Overview */}
      <PremiumSection
        title="Platform Overview"
        subtitle="User distribution and engagement breakdown"
        gradient="from-blue-500 to-indigo-600"
      >
        <MetricsDonutPanel
          userDistribution={kpis.donutMetrics?.userDistribution ?? { parents: 0, providers: 0, unverified: 0 }}
          contentBreakdown={kpis.donutMetrics?.contentBreakdown ?? { posts: 0, comments: 0, votes: 0 }}
          engagementStatus={kpis.donutMetrics?.engagementStatus ?? { activeWeekly: 0, activeMonthly: 0, churned: 0 }}
          moderationStatus={kpis.donutMetrics?.moderationStatus ?? { clean: 0, flagged: 0, banned: 0 }}
        />
      </PremiumSection>

      {/* KPI Cards - Detailed metrics with sparklines */}
      <PremiumSection
        title="Key Performance Indicators"
        subtitle="Detailed metrics with trends and AI-powered insights"
        gradient="from-purple-500 to-pink-600"
      >
        <PremiumGrid cols={3}>
          {kpiConfig.map((config) => {
          let value = kpis[config.key as keyof typeof kpis] as number;
          if (config.key === 'dauMauRatio') value = Math.round((value ?? 0) * 100);
          const change = config.changeKey
            ? (kpis.changes as Record<string, number>)?.[config.changeKey]
            : undefined;
          const insightKey = config.key === 'aiUsage7d' ? 'aiUsage' : config.key;
          const aiInsight = (kpis.aiInsights as Record<string, string>)?.[insightKey];
          const forecast = config.forecastKey
            ? (kpis.forecast as Record<string, number[]>)?.[config.forecastKey]
            : undefined;
          const sparkKeyForCard =
            config.key === 'aiUsage7d'
              ? 'value'
              : config.sparkKey;
          const sparkDataForCard =
            config.key === 'aiUsage7d'
              ? (kpis.sparkData ?? []).map((d) => ({ ...d, value: (d as { ai?: number }).ai ?? 0 }))
              : sparkData;
          return (
            <KPICard
              key={config.key}
              title={config.title}
              value={typeof value === 'number' ? value : 0}
              change={change}
              subtitle={config.subtitle}
              valueSuffix={config.valueSuffix}
              iconName={config.iconName}
              gradient={config.gradient}
              glow={config.glow}
              sparkData={sparkDataForCard}
              sparkKey={sparkKeyForCard}
              chartColor={config.chartColor}
              aiInsight={aiInsight}
              forecastValues={forecast}
            />
          );
        })}
        </PremiumGrid>
      </PremiumSection>

      {/* Quick Actions & Todo Section */}
      <PremiumGrid cols={2}>
        <QuickActions />
        <TodoWidget />
      </PremiumGrid>

      {/* Performance & Status Section */}
      <PremiumSection
        title="System Performance"
        subtitle="Real-time system health and status monitoring"
        gradient="from-cyan-500 to-blue-600"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <div className="space-y-6">
            <StatusSummary />
          </div>
        </div>
      </PremiumSection>

      {/* Activity & Reports Section */}
      <PremiumSection
        title="Platform Activity"
        subtitle="Live events and intelligence reports"
        gradient="from-orange-500 to-red-600"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <RealtimeEventFeed />
          </div>
          <div className="space-y-6">
            <ReportSummary />
            <ChurnRiskWidget />
          </div>
        </div>
      </PremiumSection>

      {/* Recent Logins - Table on desktop, cards on mobile */}
      <PremiumSection
        title="Recent User Activity"
        subtitle="Latest user logins and engagement"
        gradient="from-violet-500 to-purple-600"
        action={
          <Link href="/owner/dashboard/users">
            <PremiumButton variant="secondary" size="sm">
              <UsersIcon className="w-4 h-4 mr-2" />
              View All Users
            </PremiumButton>
          </Link>
        }
      >
        <PremiumCard variant="glass" noPadding className="overflow-hidden">

        {/* Mobile: Card layout */}
        <div className="block md:hidden divide-y divide-border">
          {recentLogins.map((user, index) => (
            <div
              key={user.id}
              className={`p-4 ${index === 0 ? 'bg-emerald-500/5' : ''}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user.profile?.displayName || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">
                    {user.profile?.displayName ||
                      user.profile?.username ||
                      'Anonymous'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.profile?.username || 'no-username'}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground truncate max-w-[180px]">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span
                    className={
                      index === 0 ? 'text-emerald-400' : 'text-muted-foreground'
                    }
                  >
                    {user.lastLoginAt
                      ? <FormattedDate date={user.lastLoginAt} style="dateTimeShort" />
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-muted-foreground"><FormattedDate date={user.createdAt} style="date" /></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 lg:px-6 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                  User
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLogins.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b border-border hover:bg-accent/50 transition-colors ${
                    index === 0 ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="py-4 px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {(user.profile?.displayName || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.profile?.displayName ||
                            user.profile?.username ||
                            'Anonymous'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.profile?.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 lg:px-6 text-slate-300">{user.email}</td>
                  <td className="py-4 px-4 lg:px-6">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
                        index === 0
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {user.lastLoginAt
                        ? <FormattedDate date={user.lastLoginAt} style="dateTimeShort" />
                        : 'Never'}
                    </span>
                  </td>
                  <td className="py-4 px-4 lg:px-6 text-muted-foreground">
                    <FormattedDate date={user.createdAt} style="date" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </PremiumCard>
      </PremiumSection>
    </div>
  );
}
