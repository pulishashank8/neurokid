'use client';

import DonutChart, { DonutChartData } from './DonutChart';
import { Users, FileText, Activity, Shield } from 'lucide-react';

interface MetricsDonutPanelProps {
  userDistribution: {
    parents: number;
    providers: number;
    unverified: number;
  };
  contentBreakdown: {
    posts: number;
    comments: number;
    votes: number;
  };
  engagementStatus: {
    activeWeekly: number;
    activeMonthly: number;
    churned: number;
  };
  moderationStatus: {
    clean: number;
    flagged: number;
    banned: number;
  };
}

const COLORS = {
  blue: '#6366f1',
  indigo: '#4f46e5',
  violet: '#8b5cf6',
  purple: '#a855f7',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  pink: '#ec4899',
  slate: '#64748b',
};

export default function MetricsDonutPanel({
  userDistribution,
  contentBreakdown,
  engagementStatus,
  moderationStatus,
}: MetricsDonutPanelProps) {
  const userTotal = userDistribution.parents + userDistribution.providers + userDistribution.unverified;
  const contentTotal = contentBreakdown.posts + contentBreakdown.comments + contentBreakdown.votes;
  const engagementTotal = engagementStatus.activeWeekly + engagementStatus.activeMonthly + engagementStatus.churned;
  const moderationTotal = moderationStatus.clean + moderationStatus.flagged + moderationStatus.banned;

  const userChartData: DonutChartData[] = [
    { name: 'Parents', value: userDistribution.parents, color: COLORS.blue },
    { name: 'Providers', value: userDistribution.providers, color: COLORS.violet },
    { name: 'Unverified', value: userDistribution.unverified, color: COLORS.slate },
  ];

  const contentChartData: DonutChartData[] = [
    { name: 'Posts', value: contentBreakdown.posts, color: COLORS.emerald },
    { name: 'Comments', value: contentBreakdown.comments, color: COLORS.teal },
    { name: 'Votes', value: contentBreakdown.votes, color: COLORS.cyan },
  ];

  const engagementChartData: DonutChartData[] = [
    { name: 'Active (7d)', value: engagementStatus.activeWeekly, color: COLORS.emerald },
    { name: 'Active (30d)', value: engagementStatus.activeMonthly, color: COLORS.amber },
    { name: 'Churned', value: engagementStatus.churned, color: COLORS.red },
  ];

  const moderationChartData: DonutChartData[] = [
    { name: 'Clean', value: moderationStatus.clean, color: COLORS.emerald },
    { name: 'Flagged', value: moderationStatus.flagged, color: COLORS.amber },
    { name: 'Banned', value: moderationStatus.banned, color: COLORS.red },
  ];

  const panels = [
    {
      title: 'User Distribution',
      icon: <Users className="w-4 h-4" />,
      data: userChartData,
      total: userTotal,
      label: 'Users',
    },
    {
      title: 'Content Breakdown',
      icon: <FileText className="w-4 h-4" />,
      data: contentChartData,
      total: contentTotal,
      label: 'Items',
    },
    {
      title: 'Engagement Status',
      icon: <Activity className="w-4 h-4" />,
      data: engagementChartData,
      total: engagementTotal,
      label: 'Users',
    },
    {
      title: 'Moderation',
      icon: <Shield className="w-4 h-4" />,
      data: moderationChartData,
      total: moderationTotal,
      label: 'Users',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {panels.map((panel, index) => (
        <div
          key={index}
          className="bg-card backdrop-blur-xl rounded-2xl border border-border p-4 sm:p-5 hover:border-border/80 transition-colors duration-500 ease-out min-w-0"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground">{panel.icon}</span>
            <h3 className="text-sm font-semibold text-foreground">{panel.title}</h3>
          </div>
          <DonutChart
            data={panel.data}
            centerValue={panel.total}
            centerLabel={panel.label}
            size="sm"
            showLegend={true}
          />
        </div>
      ))}
    </div>
  );
}

// Helper to fetch donut data from the API
export async function getDonutMetrics(prisma: {
  user: {
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  post: { count: () => Promise<number> };
  comment: { count: () => Promise<number> };
  vote: { count: () => Promise<number> };
}) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    parentsCount,
    providersCount,
    unverifiedCount,
    postsCount,
    commentsCount,
    votesCount,
    activeWeekly,
    activeMonthly,
    bannedCount,
    flaggedCount,
  ] = await Promise.all([
    prisma.user.count({ where: { userRoles: { some: { role: 'PARENT' } } } }),
    prisma.user.count({ where: { claimedProviders: { some: {} } } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.vote.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({
      where: {
        lastLoginAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
    0, // Flagged users - would need a flagged field or count from reports
  ]);

  const totalUsers = parentsCount + providersCount + unverifiedCount;
  const cleanUsers = Math.max(0, totalUsers - bannedCount - flaggedCount);
  const churnedCount = Math.max(0, totalUsers - activeWeekly - activeMonthly - bannedCount);

  return {
    userDistribution: {
      parents: parentsCount,
      providers: providersCount,
      unverified: unverifiedCount,
    },
    contentBreakdown: {
      posts: postsCount,
      comments: commentsCount,
      votes: votesCount,
    },
    engagementStatus: {
      activeWeekly,
      activeMonthly,
      churned: churnedCount,
    },
    moderationStatus: {
      clean: cleanUsers,
      flagged: flaggedCount,
      banned: bannedCount,
    },
  };
}
