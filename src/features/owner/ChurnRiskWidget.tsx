'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingDown, Users } from 'lucide-react';

interface ChurnData {
  atRiskPct: number;
  totalAtRisk: number;
  highRiskCount: number;
  highRiskUsers: Array<{ userId: string; churnProbability: number; user?: { email?: string; profile?: { displayName?: string } } }>;
}

export default function ChurnRiskWidget() {
  const [data, setData] = useState<ChurnData | null>(null);

  useEffect(() => {
    fetch('/api/owner/churn')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || data.totalAtRisk === 0) return null;

  return (
    <div className="bg-card backdrop-blur-xl rounded-2xl border border-amber-500/20 p-6">
      <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
        <TrendingDown size={20} className="text-amber-400" />
        Users At Risk of Churn
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        {data.atRiskPct}% of users ({data.totalAtRisk}) at risk · {data.highRiskCount} high risk
      </p>
      {(data.highRiskUsers ?? []).length > 0 && (
        <div className="space-y-2">
          {(data.highRiskUsers ?? []).slice(0, 5).map((p) => (
            <Link
              key={p.userId}
              href={`/owner/dashboard/users/${p.userId}`}
              className="block py-2 px-3 rounded-lg bg-accent/50 hover:bg-accent text-foreground text-sm"
            >
              {p.user?.profile?.displayName || p.user?.email || p.userId.slice(0, 8)} ·{' '}
              {(p.churnProbability * 100).toFixed(0)}% risk
            </Link>
          ))}
          <Link
            href="/owner/dashboard/users?filter=churn"
            className="block text-emerald-400 text-sm hover:underline mt-2"
          >
            View all at-risk users →
          </Link>
        </div>
      )}
    </div>
  );
}
