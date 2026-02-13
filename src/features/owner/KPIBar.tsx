'use client';

import { ArrowUp, ArrowDown, Minus, TrendingUp, Users, Activity, Cpu, FileText, MessageSquare, Clock } from 'lucide-react';

interface KPIBarItem {
  label: string;
  value: number | string;
  change?: number;
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface KPIBarProps {
  items: KPIBarItem[];
  className?: string;
}

function TrendIndicator({ change }: { change?: number }) {
  if (change === undefined) return null;

  if (change > 0) {
    return (
      <span className="flex items-center text-emerald-400 text-xs font-medium">
        <ArrowUp className="w-3 h-3 mr-0.5" />
        {change.toFixed(1)}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center text-red-400 text-xs font-medium">
        <ArrowDown className="w-3 h-3 mr-0.5" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center text-muted-foreground text-xs font-medium">
      <Minus className="w-3 h-3 mr-0.5" />
      0%
    </span>
  );
}

export default function KPIBar({ items, className = '' }: KPIBarProps) {
  return (
    <div className={`bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-xl rounded-2xl border border-border p-1 overflow-hidden transition-colors duration-500 ease-out ${className}`}>
      <div className="flex items-stretch divide-x divide-border overflow-x-auto scroll-smooth snap-x snap-mandatory [&>*]:snap-start md:flex-wrap md:overflow-visible">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-1 min-w-[110px] sm:min-w-[130px] md:min-w-0 md:flex-1 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 hover:bg-accent/50 transition-colors duration-300 first:rounded-l-xl last:rounded-r-xl touch-manipulation"
          >
            {item.icon && (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color || '#6366f1'}20` }}
              >
                <span style={{ color: item.color || '#6366f1' }}>{item.icon}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground text-xs font-medium truncate">{item.label}</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-foreground text-lg font-bold tabular-nums">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  {item.suffix}
                </span>
                <TrendIndicator change={item.change} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pre-configured KPI bar for the main dashboard
export function DashboardKPIBar({
  totalUsers,
  activeUsers,
  activeUsersChange,
  newToday,
  aiUsage,
  aiUsageChange,
  postsCount,
  postsChange,
  messagesCount,
  messagesChange,
  dauMauRatio,
}: {
  totalUsers: number;
  activeUsers: number;
  activeUsersChange?: number;
  newToday: number;
  aiUsage: number;
  aiUsageChange?: number;
  postsCount: number;
  postsChange?: number;
  messagesCount: number;
  messagesChange?: number;
  dauMauRatio: number;
}) {
  const items: KPIBarItem[] = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: <Users className="w-4 h-4" />,
      color: '#6366f1',
    },
    {
      label: 'Active (7d)',
      value: activeUsers,
      change: activeUsersChange,
      icon: <Activity className="w-4 h-4" />,
      color: '#10b981',
    },
    {
      label: 'New Today',
      value: newToday,
      icon: <TrendingUp className="w-4 h-4" />,
      color: '#8b5cf6',
    },
    {
      label: 'AI Requests (7d)',
      value: aiUsage,
      change: aiUsageChange,
      icon: <Cpu className="w-4 h-4" />,
      color: '#f472b6',
    },
    {
      label: 'Posts',
      value: postsCount,
      change: postsChange,
      icon: <FileText className="w-4 h-4" />,
      color: '#f97316',
    },
    {
      label: 'Messages (7d)',
      value: messagesCount,
      change: messagesChange,
      icon: <MessageSquare className="w-4 h-4" />,
      color: '#f43f5e',
    },
    {
      label: 'Stickiness',
      value: `${Math.round(dauMauRatio * 100)}`,
      suffix: '%',
      icon: <Clock className="w-4 h-4" />,
      color: '#06b6d4',
    },
  ];

  return <KPIBar items={items} />;
}
