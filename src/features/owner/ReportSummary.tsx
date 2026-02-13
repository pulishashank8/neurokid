'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flag,
  AlertTriangle,
  MessageSquare,
  FileText,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ReportData {
  pending: number;
  resolved: number;
  byType: {
    posts: number;
    comments: number;
    users: number;
    messages: number;
  };
  recent: Array<{
    id: string;
    type: 'post' | 'comment' | 'user' | 'message';
    reason: string;
    createdAt: string;
    status: 'pending' | 'resolved';
  }>;
}

interface ReportSummaryProps {
  className?: string;
}

export default function ReportSummary({ className = '' }: ReportSummaryProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch('/api/owner/moderation/summary');
      if (!res.ok) throw new Error('Failed to fetch');
      const reportData = await res.json();
      setData(reportData);
    } catch {
      // No fake data – show zeros when API fails
      setData({
        pending: 0,
        resolved: 0,
        byType: { posts: 0, comments: 0, users: 0, messages: 0 },
        recent: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Flag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Moderation Reports</h3>
            <p className="text-sm text-muted-foreground">Content flagged for review</p>
          </div>
        </div>
        <Link
          href="/owner/dashboard/moderation"
          className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Pending Review
              </div>
              <div className="text-2xl font-bold text-white">{data.pending}</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                <CheckCircle2 className="w-3 h-3" />
                Resolved (7d)
              </div>
              <div className="text-2xl font-bold text-white">{data.resolved}</div>
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="flex gap-4 mb-5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="w-3 h-3" />
              Posts: <span className="text-white font-medium">{data.byType.posts}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              Comments: <span className="text-white font-medium">{data.byType.comments}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3 h-3" />
              Users: <span className="text-white font-medium">{data.byType.users}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              Messages: <span className="text-white font-medium">{data.byType.messages}</span>
            </div>
          </div>

          {/* Recent Reports */}
          {data.recent.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Recent Reports
              </div>
              {data.recent.slice(0, 3).map((report) => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    report.status === 'pending'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={report.status === 'pending' ? 'text-amber-400' : 'text-muted-foreground'}>
                      {getTypeIcon(report.type)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white capitalize">
                        {report.type} Report
                      </div>
                      <div className="text-xs text-muted-foreground">{report.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(report.createdAt)}</span>
                    {report.status === 'pending' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No reports to display</p>
        </div>
      )}
    </div>
  );
}
