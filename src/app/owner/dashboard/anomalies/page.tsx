'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Loader2, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';
import { PremiumCard, PremiumStatCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface Anomaly {
  id: string;
  anomalyType: string;
  description: string;
  severity: string;
  detectedAt: string;
  resolvedAt: string | null;
  metadata?: Record<string, unknown>;
}

function getSeverityClasses(severity: string): string {
  const base = 'px-2.5 py-1 rounded-lg text-xs font-medium';
  if (severity === 'critical') return `${base} bg-rose-500/20 text-rose-600 dark:text-rose-400`;
  if (severity === 'warning') return `${base} bg-amber-500/20 text-amber-600 dark:text-amber-400`;
  return `${base} bg-muted text-muted-foreground`;
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  const fetchAnomalies = (): Promise<void> => {
    setLoading(true);
    return fetch('/api/owner/anomalies')
      .then((r) => r.json())
      .then((d) => {
        setAnomalies(d.anomalies ?? []);
        setUnresolvedCount(d.unresolvedCount ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  async function resolve(id: string) {
    const res = await fetch(`/api/owner/anomalies/${id}/resolve`, { method: 'PATCH' });
    if (res.ok) {
      setAnomalies((prev) => prev.map((a) => (a.id === id ? { ...a, resolvedAt: new Date().toISOString() } : a)));
      setUnresolvedCount((c) => Math.max(0, c - 1));
    }
  }

  async function runCheckNow() {
    setRunningCheck(true);
    try {
      const res = await fetch('/api/cron/anomaly-detection');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Check failed');
      await fetchAnomalies();
      toast.success('Anomaly check completed');
    } catch (err) {
      console.error('Anomaly check failed:', err);
      toast.error(err instanceof Error ? err.message : 'Anomaly check failed');
    } finally {
      setRunningCheck(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Anomalies</h1>
          {unresolvedCount > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {unresolvedCount} open
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1">Detected anomalies and their resolution status</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Activity className="w-3 h-3" />
            Live data from system health checks
          </span>
          <button
            onClick={runCheckNow}
            disabled={runningCheck}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${runningCheck ? 'animate-spin' : ''}`} />
            {runningCheck ? 'Running check...' : 'Run check now'}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Description</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Severity</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Detected</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-emerald-500/50" />
                    <p className="text-foreground font-medium">No anomalies detected</p>
                    <p className="text-muted-foreground text-sm mt-1">System health checks run every 15 minutes</p>
                    <p className="text-muted-foreground text-xs mt-2">Active user drops, report spikes, AI failures, DB latency, and messaging spikes are monitored</p>
                  </td>
                </tr>
              ) : (
                anomalies.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 text-foreground font-mono text-sm">{a.anomalyType}</td>
                    <td className="py-4 px-6 text-foreground">{a.description}</td>
                    <td className="py-4 px-6">
                      <span className={getSeverityClasses(a.severity)}>{a.severity}</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-sm">
                      {format(new Date(a.detectedAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-4 px-6">
                      {a.resolvedAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
                          <CheckCircle size={14} /> Resolved
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-2 font-medium">
                          <AlertTriangle size={14} /> Open
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {!a.resolvedAt && (
                        <button
                          onClick={() => resolve(a.id)}
                          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
