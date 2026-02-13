'use client';

import { useState, useEffect } from 'react';
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
import { DollarSign, Loader2, TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  revenue: number;
  cost: number;
  net: number;
}

interface RevenueChartProps {
  className?: string;
  monthsBack?: number;
}

export default function RevenueChart({
  className = '',
  monthsBack = 12,
}: RevenueChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/owner/revenue?months=${monthsBack}`).then((r) => r.json()),
      fetch(`/api/owner/costs?months=${monthsBack}`).then((r) => r.json()),
    ])
      .then(([revRes, costRes]) => {
        const revenueByMonth = Object.fromEntries(
          (revRes.revenue ?? []).map((r: { month: string; total: number }) => [r.month, r.total])
        );
        const costByMonth = Object.fromEntries(
          (costRes.costs ?? []).map((c: { month: string; total: number }) => [c.month, c.total])
        );

        const months = new Set([
          ...Object.keys(revenueByMonth),
          ...Object.keys(costByMonth),
        ]);
        const sorted = Array.from(months).sort();

        const chartData: ChartDataPoint[] = sorted.map((m) => ({
          month: m,
          revenue: revenueByMonth[m] ?? 0,
          cost: costByMonth[m] ?? 0,
          net: (revenueByMonth[m] ?? 0) - (costByMonth[m] ?? 0),
        }));

        setData(chartData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [monthsBack]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalCost = data.reduce((s, d) => s + d.cost, 0);
  const totalNet = totalRevenue - totalCost;

  return (
    <div
      className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Revenue vs Costs</h3>
            <p className="text-sm text-muted-foreground">Monthly income and expenses</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Total Revenue
          </div>
          <div className="text-xl font-bold text-emerald-400">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Total Costs
          </div>
          <div className="text-xl font-bold text-rose-400">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">Net</div>
          <div
            className={`text-xl font-bold ${totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data yet. Add costs and revenue entries to see the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Costs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
