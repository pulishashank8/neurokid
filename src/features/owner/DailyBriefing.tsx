'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import {
  Sun,
  Moon,
  Sunrise,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MessageSquare,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface BriefingData {
  greeting: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  highlights: {
    newUsers: number;
    activeUsers: number;
    aiRequests: number;
    pendingReports: number;
    errors24h: number;
    messagesCount: number;
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
  }>;
  aiSummary?: string;
}

interface DailyBriefingProps {
  className?: string;
}

export default function DailyBriefing({ className = '' }: DailyBriefingProps) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/owner/briefing');
      if (!res.ok) throw new Error('Failed to fetch');
      const briefingData = await res.json();
      setData(briefingData);
    } catch {
      setError('Could not load briefing. Data comes from your database.');
      // Show zeros – no fake numbers
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      const greeting = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
      setData({
        greeting,
        timeOfDay,
        highlights: {
          newUsers: 0,
          activeUsers: 0,
          aiRequests: 0,
          pendingReports: 0,
          errors24h: 0,
          messagesCount: 0,
        },
        alerts: [{ type: 'warning', message: 'Briefing data unavailable. Check your connection and try again.' }],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunrise className="w-6 h-6 text-amber-400" />;
      case 'afternoon':
        return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'evening':
        return <Moon className="w-6 h-6 text-indigo-400" />;
      default:
        return <Sun className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-card to-card/95 backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const showRetry = error !== null;

  return (
    <div className={`bg-gradient-to-br from-card to-card/95 backdrop-blur-xl rounded-2xl border border-border overflow-hidden transition-colors duration-500 ease-out ${className}`}>
      {/* Header with greeting */}
      <div className="p-6 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border-b border-border">
        <div className="flex items-center gap-4">
          {getTimeIcon(data.timeOfDay)}
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.greeting}!</h2>
            <p className="text-muted-foreground text-sm">
              Here's your daily briefing for <FormattedDate date={new Date()} style="weekdayDate" />
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-muted/40 rounded-xl p-3 text-center transition-colors duration-500">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs mb-1">
              <Users className="w-3 h-3" />
              New Users
            </div>
            <div className="text-xl font-bold text-foreground">{data.highlights.newUsers}</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center transition-colors duration-500">
            <div className="flex items-center justify-center gap-1 text-blue-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Active
            </div>
            <div className="text-xl font-bold text-foreground">{data.highlights.activeUsers}</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center transition-colors duration-500">
            <div className="flex items-center justify-center gap-1 text-purple-400 text-xs mb-1">
              <Cpu className="w-3 h-3" />
              AI Requests
            </div>
            <div className="text-xl font-bold text-foreground">{data.highlights.aiRequests}</div>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {data.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  alert.type === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : alert.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                {getAlertIcon(alert.type)}
                <span className="text-sm text-foreground">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        {data.aiSummary && (
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              AI INSIGHTS
            </div>
            <p className="text-sm text-foreground leading-relaxed">{data.aiSummary}</p>
          </div>
        )}

        {/* Action Items Summary */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            {data.highlights.pendingReports > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                {data.highlights.pendingReports} pending reports
              </span>
            )}
            {data.highlights.errors24h > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <TrendingDown className="w-4 h-4" />
                {data.highlights.errors24h} errors (24h)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {data.highlights.messagesCount} messages today
            </span>
            {showRetry && (
              <button
                type="button"
                onClick={() => fetchBriefing()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
