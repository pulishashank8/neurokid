'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  ThumbsUp,
  Bug,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import DonutChart from '@/features/owner/DonutChart';
import {
  PremiumPageHeader,
  PremiumSection,
  PremiumCard,
  PremiumGrid,
  PremiumStatCard,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

type FeedbackType = 'QUICK_REACTION' | 'NPS' | 'BUG_REPORT' | 'FEATURE_REQUEST';

interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  rating: number | null;
  text: string | null;
  category: string | null;
  pagePath: string | null;
  userEmail: string | null;
  isReviewed: boolean;
  createdAt: string;
}

interface FeedbackData {
  feedbacks: Feedback[];
  counts: Record<string, number>;
}

interface NPSData {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  scoreChange: number | null;
  trend: { date: string; score: number; count: number }[];
}

interface QuickReactionsData {
  avg: number | null;
  count: number;
  byCategory: Record<string, number>;
}

const TYPE_CONFIG: Record<string, { icon: typeof MessageCircle; color: string }> = {
  QUICK_REACTION: { icon: ThumbsUp, color: 'text-cyan-400 bg-cyan-500/10' },
  NPS: { icon: BarChart3, color: 'text-violet-400 bg-violet-500/10' },
  BUG_REPORT: { icon: Bug, color: 'text-rose-400 bg-rose-500/10' },
  FEATURE_REQUEST: { icon: Lightbulb, color: 'text-amber-400 bg-amber-500/10' },
};

const HOUR_OPTIONS = [
  { value: 24, label: '24 hours' },
  { value: 168, label: '7 days' },
  { value: 720, label: '30 days' },
] as const;

export default function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [npsData, setNpsData] = useState<NPSData | null>(null);
  const [quickReactions, setQuickReactions] = useState<QuickReactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(168);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const fetchFeedback = useCallback(async () => {
    try {
      const params = new URLSearchParams({ hours: String(hours), limit: '50' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/owner/feedback?${params}`);
      if (res.ok) setFeedbackData(await res.json());
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [hours, typeFilter]);

  const fetchNPS = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/nps?period=${period}`);
      if (res.ok) setNpsData(await res.json());
    } catch (err) {
      console.error('Failed to fetch NPS:', err);
    }
  }, [period]);

  const fetchQuickReactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/feedback/quick-reactions?hours=${hours}`);
      if (res.ok) setQuickReactions(await res.json());
    } catch (err) {
      console.error('Failed to fetch quick reactions:', err);
    }
  }, [hours]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFeedback(), fetchNPS(), fetchQuickReactions()]).finally(() =>
      setLoading(false)
    );
  }, [fetchFeedback, fetchNPS, fetchQuickReactions]);

  const feedbacks = feedbackData?.feedbacks ?? [];
  const counts = feedbackData?.counts ?? {};

  const sentimentPieData =
    npsData && npsData.total > 0
      ? [
          { name: 'Promoters', value: npsData.promoters, color: '#4ade80' },
          { name: 'Passives', value: npsData.passives, color: '#fbbf24' },
          { name: 'Detractors', value: npsData.detractors, color: '#f87171' },
        ].filter((d) => d.value > 0)
      : [];

  const featureRequests = feedbacks
    .filter((f) => f.type === 'FEATURE_REQUEST')
    .slice(0, 5);
  const bugReports = feedbacks.filter((f) => f.type === 'BUG_REPORT').slice(0, 5);

  const qrCategories = quickReactions?.byCategory
    ? Object.entries(quickReactions.byCategory)
        .map(([name, value]) => ({
          name: name === 'general' ? 'General' : name,
          scorePct: Math.round(((value + 1) / 2) * 100),
          raw: value,
        }))
        .sort((a, b) => b.raw - a.raw)
        .slice(0, 6)
    : [];

  if (loading && !feedbackData && !npsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="User Feedback & NPS"
        subtitle="Quick reactions, NPS scores, bug reports, and feature requests"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Feedback' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              {HOUR_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setHours(o.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hours === o.value
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <PremiumButton
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchFeedback(),
                  fetchNPS(),
                  fetchQuickReactions(),
                ]).finally(() => setLoading(false));
              }}
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              size="sm"
            >
              Refresh
            </PremiumButton>
          </div>
        }
        gradient="from-violet-600 via-purple-600 to-pink-600"
      />

      {/* NPS Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2"
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Net Promoter Score</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="px-2 py-1 rounded bg-muted/50 border border-border text-foreground text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-foreground">
              {npsData?.score ?? 0}
            </span>
            {npsData?.scoreChange != null && (
              <span
                className={`text-sm ${
                npsData.scoreChange > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : npsData.scoreChange < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground'
                }`}
              >
                {npsData.scoreChange > 0 ? '+' : ''}
                {npsData.scoreChange} vs prior period
              </span>
            )}
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-muted-foreground">Promoters</span>
              <span className="text-foreground font-medium">{npsData?.promoters ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Meh className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-muted-foreground">Passives</span>
              <span className="text-foreground font-medium">{npsData?.passives ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-muted-foreground">Detractors</span>
              <span className="text-foreground font-medium">{npsData?.detractors ?? 0}</span>
            </div>
          </div>
            <p className="text-xs text-muted-foreground mt-2">{npsData?.total ?? 0} responses</p>
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-1"
        >
          <PremiumCard variant="glass" className="h-full p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-foreground mb-3">Sentiment</h2>
          {sentimentPieData.length > 0 ? (
            <DonutChart
              data={sentimentPieData}
              centerValue={npsData?.score ?? 0}
              centerLabel="NPS"
              size="sm"
              showLegend={true}
            />
          ) : (
            <p className="text-muted-foreground text-sm py-4">No NPS data</p>
          )}
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2"
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">NPS Trend</h2>
          {npsData?.trend?.length ? (
            <div className="flex items-end gap-1 h-24">
              {npsData.trend.map((t, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[6px] bg-primary/60 rounded-t hover:bg-primary/80 transition-colors"
                  style={{
                    height: `${Math.max(0, (t.score + 100) / 200) * 100}%`,
                    minHeight: '4px',
                  }}
                  title={`${t.date}: ${t.score} (${t.count} responses)`}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-6">No NPS data yet</p>
          )}
          </PremiumCard>
        </motion.div>
      </div>

      {/* Counts by type */}
      <PremiumGrid cols={4}>
        {[
          { type: 'QUICK_REACTION', label: 'Quick Reactions', gradient: 'from-cyan-500 to-blue-600' },
          { type: 'NPS', label: 'NPS Scores', gradient: 'from-violet-500 to-purple-600' },
          { type: 'BUG_REPORT', label: 'Bug Reports', gradient: 'from-rose-500 to-red-600' },
          { type: 'FEATURE_REQUEST', label: 'Feature Requests', gradient: 'from-amber-500 to-orange-600' },
        ].map((item, i) => {
          const config = TYPE_CONFIG[item.type];
          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <PremiumStatCard
                title={item.label}
                value={(counts[item.type] ?? 0).toString()}
                icon={config.icon}
                gradient={item.gradient}
              />
            </motion.div>
          );
        })}
      </PremiumGrid>

      {/* Top Feature Requests, Bug Reports, Quick Reaction Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-foreground">Top Feature Requests</h2>
          </div>
          {featureRequests.length > 0 ? (
            <ul className="space-y-3">
              {featureRequests.map((f) => (
                <li key={f.id} className="text-sm">
                  <p className="text-foreground line-clamp-2">{f.text || '—'}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {f.category && `[${f.category}] `}
                    {format(new Date(f.createdAt), 'MMM d')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm py-4">No feature requests in this period</p>
          )}
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h2 className="text-lg font-bold text-foreground">Bug Reports</h2>
          </div>
          {bugReports.length > 0 ? (
            <ul className="space-y-3">
              {bugReports.map((f) => (
                <li key={f.id} className="text-sm">
                  <p className="text-foreground line-clamp-2">{f.text || '—'}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {f.pagePath && `${f.pagePath} · `}
                    {format(new Date(f.createdAt), 'MMM d')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm py-4">No bug reports in this period</p>
          )}
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-foreground">Quick Reaction Averages</h2>
          </div>
          {quickReactions && (quickReactions.count > 0 || Object.keys(quickReactions.byCategory).length > 0) ? (
            <div className="space-y-3">
              {quickReactions.avg != null && (
                <p className="text-muted-foreground text-sm">
                  Overall: <span className="text-primary font-medium">{Math.round(((quickReactions.avg + 1) / 2) * 100)}%</span> positive ({quickReactions.count} reactions)
                </p>
              )}
              {qrCategories.length > 0 ? (
                <div className="space-y-2">
                  {qrCategories.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-20 truncate">{c.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all"
                          style={{ width: `${c.scorePct}%` }}
                        />
                      </div>
                      <span className="text-foreground text-xs w-10">{c.scorePct}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No category breakdown</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4">No quick reactions in this period</p>
          )}
          </PremiumCard>
        </motion.div>
      </div>

      {/* Feedback feed */}
      <PremiumCard variant="glass" className="overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Recent Feedback</h2>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-foreground text-sm"
          >
            <option value="all">All types</option>
            {Object.keys(TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm uppercase">
                  Type
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm uppercase">
                  User
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm uppercase">
                  Content
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm uppercase">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {!feedbacks.length ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No feedback in the selected period</p>
                  </td>
                </tr>
              ) : (
                feedbacks.map((f) => {
                  const config = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.QUICK_REACTION;
                  const Icon = config.icon;
                  return (
                    <tr
                      key={f.id}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {f.type.replace('_', ' ')}
                        </span>
                        {f.rating != null && f.type !== 'BUG_REPORT' && f.type !== 'FEATURE_REQUEST' && (
                          <span className="ml-2 text-muted-foreground text-sm">
                            {f.rating}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-sm">
                        {f.userEmail ?? f.userId.slice(0, 8) + '…'}
                      </td>
                      <td className="py-4 px-6 text-foreground text-sm max-w-md">
                        {f.text ? (
                          <span className="line-clamp-2">{f.text}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {f.category && (
                          <span className="text-muted-foreground text-xs ml-1">
                            [{f.category}]
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-sm">
                        {format(new Date(f.createdAt), 'MMM d HH:mm')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
}
