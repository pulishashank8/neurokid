'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, ArrowRight } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'warning' | 'critical';
  dbLatencyMs?: number;
}

export default function SystemStatusWidget() {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch('/api/owner/system-health')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const statusColor =
    data.status === 'critical'
      ? 'border-red-500/30 bg-red-500/5'
      : data.status === 'warning'
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-emerald-500/30 bg-emerald-500/5';

  const statusText =
    data.status === 'critical'
      ? 'Critical'
      : data.status === 'warning'
        ? 'Attention needed'
        : 'All systems operational';

  return (
    <div
      className={`rounded-2xl border p-4 ${statusColor} flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-800/50">
          <Database className="text-blue-400" size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">System Status</p>
          <p className="text-xs text-slate-400">
            DB latency: {data.dbLatencyMs ?? 0}ms · {statusText}
          </p>
        </div>
      </div>
      <Link
        href="/owner/dashboard/system"
        className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
      >
        Details
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
