'use client';

import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  FileText,
  Cpu,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  FileText,
  Cpu,
};

interface SparkPoint {
  date: string;
  users?: number;
  active?: number;
  value?: number;
}

interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  subtitle?: string;
  valueSuffix?: string;
  iconName: string;
  gradient: string;
  glow: string;
  sparkData?: SparkPoint[];
  sparkKey?: 'users' | 'active' | 'value';
  chartColor?: string;
  aiInsight?: string;
  forecastValues?: number[];
}

export default function KPICard({
  title,
  value,
  change,
  subtitle,
  valueSuffix,
  iconName,
  gradient,
  glow,
  sparkData = [],
  sparkKey = 'users',
  chartColor = '#10b981',
  aiInsight,
  forecastValues,
}: KPICardProps) {
  const Icon = ICON_MAP[iconName] ?? Activity;
  const historicalData = sparkData.map((d) => ({
    ...d,
    v: (d[sparkKey] as number) ?? 0,
  }));
  const forecastPoints =
    forecastValues?.map((v, i) => ({ date: `D+${i + 1}`, v, isForecast: true })) ?? [];
  const chartData = [...historicalData, ...forecastPoints];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative bg-card backdrop-blur-xl rounded-2xl border border-border p-6 hover:border-border/80 transition-colors duration-500 ease-out shadow-xl ${glow}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
          <p className="text-4xl font-bold text-foreground tabular-nums">
            {value.toLocaleString()}
            {valueSuffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-sm font-semibold ${
                  change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-sm">vs prev period</span>
            </div>
          )}
          {subtitle && (
            <p className="text-slate-500 text-sm mt-2">{subtitle}</p>
          )}
          {aiInsight && (
            <p className="text-muted-foreground text-xs mt-2 italic border-l-2 border-emerald-500/50 pl-2">
              {aiInsight}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} flex-shrink-0`}
        >
          <Icon className="text-primary-foreground" size={24} />
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="relative mt-4 h-12 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`kpi-fill-${title.replace(/\s/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={chartColor}
                strokeWidth={1.5}
                fill={`url(#kpi-fill-${title.replace(/\s/g, '-')})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
