'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, TrendingUp, Clock, Loader2 } from 'lucide-react';

interface PerformanceDataPoint {
  time: string;
  responseTime: number;
  activeUsers: number;
  requests: number;
}

interface PerformanceChartProps {
  className?: string;
}

export default function PerformanceChart({ className = '' }: PerformanceChartProps) {
  const [data, setData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/owner/performance?period=${period}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res) => {
        setData(res?.data ?? []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period]);

  const withRequests = data.filter((d) => d.requests > 0);
  const avgResponseTime =
    withRequests.length > 0
      ? Math.round(
          withRequests.reduce((sum, d) => sum + d.responseTime, 0) /
            withRequests.length
        )
      : 0;
  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);
  const peakUsers = data.length > 0 ? Math.max(...data.map(d => d.activeUsers)) : 0;

  return (
    <div className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-4 sm:p-6 min-w-0 overflow-hidden ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">System Performance</h3>
            <p className="text-sm text-muted-foreground">Response times and activity</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? 'bg-violet-500 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="w-3 h-3" />
            Avg Response
          </div>
          <div className="text-xl font-bold text-foreground">{avgResponseTime}ms</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Total Requests
          </div>
          <div className="text-xl font-bold text-foreground">{totalRequests.toLocaleString()}</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Activity className="w-3 h-3" />
            Peak Users
          </div>
          <div className="text-xl font-bold text-foreground">{peakUsers}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <Activity className="w-10 h-10 opacity-50" />
            <p>No performance data yet</p>
            <p className="text-xs">Data is collected as users interact with the app.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="time"
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
                tickFormatter={(v) => `${v}ms`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="responseTime"
                name="Response Time (ms)"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#responseTimeGradient)"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#activeUsersGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
