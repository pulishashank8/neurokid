'use client';

import { useEffect, useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface Metrics {
  metrics: Record<string, number>;
}

export default function PlatformQualityMetrics() {
  const [data, setData] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch('/api/owner/data-quality')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.metrics || Object.keys(data.metrics).length === 0) return null;

  const labels: Record<string, string> = {
    missing_profile_pct: 'Missing Profile %',
    incomplete_profile_pct: 'Incomplete Profile %',
    stale_users_90d: 'Stale Users (90d)',
    stale_users_pct: 'Stale Users %',
    duplicate_records: 'Duplicate Records',
    posts_without_author_pct: 'Posts w/o Author %',
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Database size={20} className="text-emerald-400" />
        Platform Data Health
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(data.metrics)
          .filter(([k]) => !k.includes('monitor_error'))
          .map(([k, v]) => (
            <div
              key={k}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                {labels[k] ?? k}
              </p>
              <p
                className={`text-lg font-bold ${
                  (k.includes('pct') && v > 10) || (k.includes('duplicate') && v > 0)
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {typeof v === 'number' && (k.includes('pct') || k.includes('_pct'))
                  ? `${v}%`
                  : v}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
