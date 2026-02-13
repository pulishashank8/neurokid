'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

const DB_WARN_MS = 1500;
const RATE_LIMIT_WARN = 50;
const AI_FAILURES_WARN = 10;

interface HealthData {
  status: 'healthy' | 'warning' | 'critical';
  dbLatencyMs?: number;
  rateLimitTriggers?: number;
  aiFailuresLast5m?: number;
  error?: string;
}

interface AnomalyData {
  anomalies: Array<{ id: string; description: string; severity: string }>;
  unresolvedCount: number;
}

export default function AlertBanner() {
  const [data, setData] = useState<HealthData | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/owner/system-health')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: 'critical', error: 'Failed to fetch health' }));
    fetch('/api/owner/anomalies?unresolved=true')
      .then((r) => r.json())
      .then(setAnomalyData)
      .catch(() => setAnomalyData(null));
  }, []);

  const hasUnresolvedAnomalies = anomalyData && anomalyData.unresolvedCount > 0;
  const topAnomaly = anomalyData?.anomalies?.[0];

  if ((!data || data.status === 'healthy') && !hasUnresolvedAnomalies) return null;
  if (dismissed) return null;

  const isCritical =
    (data?.status === 'critical') ||
    (hasUnresolvedAnomalies && topAnomaly?.severity === 'critical');
  const bg = isCritical ? 'bg-red-500/20 border-red-500/50' : 'bg-amber-500/20 border-amber-500/50';
  const text = isCritical ? 'text-red-200' : 'text-amber-200';
  const linkColor = isCritical ? 'text-red-300 hover:text-red-100' : 'text-amber-300 hover:text-amber-100';

  const reasons: string[] = [];
  if (data?.dbLatencyMs && data.dbLatencyMs >= DB_WARN_MS) {
    reasons.push(`DB latency ${data.dbLatencyMs}ms`);
  }
  if (data?.rateLimitTriggers && data.rateLimitTriggers >= RATE_LIMIT_WARN) {
    reasons.push(`${data.rateLimitTriggers} rate limit triggers`);
  }
  if (data?.aiFailuresLast5m && data.aiFailuresLast5m > AI_FAILURES_WARN) {
    reasons.push(`${data.aiFailuresLast5m} AI failures`);
  }
  if (topAnomaly) {
    reasons.push(topAnomaly.description);
  }
  if (data?.error) {
    reasons.push(data.error);
  }
  const message =
    reasons.length > 0 ? reasons.join(' · ') : 'System health degraded';

  return (
    <div
      className={`mb-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${bg} ${text}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="shrink-0" size={20} />
        <span className="text-sm font-medium">{message}</span>
        <Link
          href={hasUnresolvedAnomalies ? '/owner/dashboard/anomalies' : '/owner/dashboard/system'}
          className={`text-sm underline ${linkColor}`}
        >
          {hasUnresolvedAnomalies ? 'View anomalies →' : 'View details →'}
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
}
