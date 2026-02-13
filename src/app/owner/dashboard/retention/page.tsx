'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader, PremiumSection } from '@/components/owner/PremiumSection';

interface RetentionData {
  cohortRetention: { cohortDate: string; day1: number; day7: number; day30: number }[];
}

export default function RetentionPage() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/owner/retention');
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || body?.detail || res.statusText);
    if (body?.error) throw new Error(body.error);
    return { cohortRetention: body.cohortRetention ?? [] };
  }, []);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load retention data'))
      .finally(() => setLoading(false));
  }, [fetchData]);

  const handleCompute = async () => {
    setComputing(true);
    setError(null);
    try {
      const res = await fetch('/api/owner/retention/compute', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        const msg = body?.detail || body?.error || res.statusText;
        const hint = body?.hint ? ` ${body.hint}` : '';
        throw new Error(msg + hint);
      }
      const refreshed = await fetchData();
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compute failed');
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PremiumPageHeader
          title="User Retention"
          subtitle="Day 1, Day 7, Day 30 retention by signup cohort"
          breadcrumbs={[
            { label: 'Owner', href: '/owner' },
            { label: 'Dashboard', href: '/owner/dashboard' },
            { label: 'Retention' }
          ]}
          gradient="from-purple-600 via-pink-600 to-rose-600"
        />
        <PremiumCard variant="gradient" className="border-amber-500/30 bg-amber-500/10">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Unable to load data</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </PremiumCard>
      </div>
    );
  }

  if (!data) return null;

  const chartData = (data.cohortRetention ?? []).map((c) => ({
    ...c,
    cohort: format(new Date(c.cohortDate), 'MMM d'),
  }));

  return (
    <div className="space-y-8">
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="User Retention"
        subtitle="Day 1, Day 7, Day 30 retention by signup cohort"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Retention' }
        ]}
        actions={
          <PremiumButton
            onClick={handleCompute}
            disabled={computing}
            variant="success"
            loading={computing}
          >
            <RefreshCw className="w-4 h-4" />
            {computing ? 'Computing…' : 'Compute Retention'}
          </PremiumButton>
        }
        gradient="from-purple-600 via-pink-600 to-rose-600"
      />

      {/* Cohort Retention Chart */}
      <PremiumSection
        title="Cohort Retention"
        subtitle="Track user return rates over time"
        icon={<TrendingUp className="w-5 h-5" />}
        gradient="from-purple-500 to-pink-600"
      >
        <PremiumCard variant="glass" className="p-6">
        {chartData.length === 0 ? (
          <div className="space-y-4">
            <p className="text-slate-500">No retention data yet. Click &quot;Compute retention&quot; to calculate D1/D7/D30 rates from your user signups and logins.</p>
            <p className="text-slate-600 text-sm">Requires cohorts at least 30 days old. Data comes from User (createdAt, lastLoginAt).</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="cohort" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                  labelFormatter={(label, payload) => payload[0]?.payload?.cohortDate ?? label}
                />
                <Legend />
                <Bar dataKey="day1" name="D1" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="day7" name="D7" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="day30" name="D30" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        </PremiumCard>
      </PremiumSection>
    </div>
  );
}
