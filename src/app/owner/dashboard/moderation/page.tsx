'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Shield, FileText, MessageSquare, AlertTriangle } from 'lucide-react';
import PostModeration from '@/features/owner/PostModeration';
import CommentModeration from '@/features/owner/CommentModeration';
import {
  PremiumPageHeader,
  PremiumSection,
  PremiumCard,
  PremiumStatCard,
  PremiumGrid,
} from '@/components/owner/PremiumSection';

interface ModerationData {
  metrics: {
    postsToday: number;
    commentsToday: number;
    reportsSubmitted: number;
    flaggedContent: number;
    usersWarnedBanned: number;
    bannedUsers: number;
  };
  reportedPosts: Array<{
    id: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: string;
    postStatus?: string;
    isLocked?: boolean;
    isPinned?: boolean;
    authorId?: string;
  }>;
  reportedComments: Array<{
    id: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: string;
    commentStatus?: string;
    authorId?: string;
  }>;
  violations: Array<{
    id: string;
    action: string;
    targetUserId: string;
    targetUser: string;
    createdAt: string;
  }>;
}

const DEFAULT_DATA: ModerationData = {
  metrics: {
    postsToday: 0,
    commentsToday: 0,
    reportsSubmitted: 0,
    flaggedContent: 0,
    usersWarnedBanned: 0,
    bannedUsers: 0,
  },
  reportedPosts: [],
  reportedComments: [],
  violations: [],
};

export default function ModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/owner/moderation')
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) return Promise.reject(new Error(body?.error || r.statusText));
        if (body?.error) return Promise.reject(new Error(body.error));
        return body;
      })
      .then((body) =>
        setData({
          metrics: body.metrics ?? DEFAULT_DATA.metrics,
          reportedPosts: body.reportedPosts ?? [],
          reportedComments: body.reportedComments ?? [],
          violations: body.violations ?? [],
        })
      )
      .catch((err) => setError(err.message || 'Failed to load moderation data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PremiumPageHeader
          title="Community & Safety"
          subtitle="Moderation dashboard and reported content"
          breadcrumbs={[
            { label: 'Owner', href: '/owner' },
            { label: 'Dashboard', href: '/owner/dashboard' },
            { label: 'Moderation' },
          ]}
          gradient="from-rose-600 via-red-600 to-orange-600"
        />
        <PremiumCard variant="glass">
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <p className="text-amber-600 dark:text-amber-400 font-medium">Unable to load data</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
          </div>
        </PremiumCard>
      </div>
    );
  }

  if (!data) return null;

  const metrics = data.metrics ?? DEFAULT_DATA.metrics;
  const reportedPosts = data.reportedPosts ?? [];
  const reportedComments = data.reportedComments ?? [];
  const violations = data.violations ?? [];

  const metricCards = [
    { label: 'Posts Today', value: metrics.postsToday, icon: FileText },
    { label: 'Comments Today', value: metrics.commentsToday, icon: MessageSquare },
    { label: 'Reports (7d)', value: metrics.reportsSubmitted, icon: AlertTriangle },
    { label: 'Flagged Content', value: metrics.flaggedContent, icon: Shield },
    { label: 'Warned/Banned', value: metrics.usersWarnedBanned, icon: Shield },
    { label: 'Banned Users', value: metrics.bannedUsers, icon: Shield },
  ];

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Community & Safety"
        subtitle="Moderation dashboard and reported content"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Moderation' },
        ]}
        gradient="from-rose-600 via-red-600 to-orange-600"
      />

      <PremiumGrid cols={6}>
        <PremiumStatCard
          title="Posts Today"
          value={metrics.postsToday.toString()}
          icon={FileText}
          gradient="from-blue-500 to-indigo-600"
        />
        <PremiumStatCard
          title="Comments Today"
          value={metrics.commentsToday.toString()}
          icon={MessageSquare}
          gradient="from-emerald-500 to-teal-600"
        />
        <PremiumStatCard
          title="Reports (7d)"
          value={metrics.reportsSubmitted.toString()}
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-600"
        />
        <PremiumStatCard
          title="Flagged Content"
          value={metrics.flaggedContent.toString()}
          icon={Shield}
          gradient="from-rose-500 to-red-600"
        />
        <PremiumStatCard
          title="Warned/Banned"
          value={metrics.usersWarnedBanned.toString()}
          icon={Shield}
          gradient="from-purple-500 to-pink-600"
        />
        <PremiumStatCard
          title="Banned Users"
          value={metrics.bannedUsers.toString()}
          icon={Shield}
          gradient="from-violet-500 to-purple-600"
        />
      </PremiumGrid>

      <PremiumSection
        title="Reported Content"
        subtitle="Posts and comments flagged by the community"
        icon={Shield}
        gradient="from-rose-500 to-red-600"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <PremiumCard variant="glass">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
              <h2 className="font-bold text-foreground">Reported Posts</h2>
            </div>
          <div className="max-h-80 overflow-y-auto">
            {reportedPosts.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">No reported posts</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="p-3">Post</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reporter</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportedPosts.slice(0, 15).map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3">
                        <Link
                          href={`/community/${r.targetId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View
                        </Link>
                        <span className="text-muted-foreground ml-1">· {r.reason}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === 'OPEN'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : r.status === 'RESOLVED'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-foreground">{r.reporter || '-'}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(r.createdAt), 'MMM d')}</td>
                      <td className="p-3">
                        <PostModeration
                          postId={r.targetId}
                          status={r.postStatus ?? 'ACTIVE'}
                          isLocked={r.isLocked ?? false}
                          isPinned={r.isPinned ?? false}
                          onStatusChange={() => setData((d) => d ? { ...d, reportedPosts: (d.reportedPosts ?? []).map((p) => p.id === r.id ? { ...p, postStatus: 'REMOVED' } : p) } : null)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </PremiumCard>

          <PremiumCard variant="glass">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
              <h2 className="font-bold text-foreground">Reported Comments</h2>
            </div>
          <div className="max-h-80 overflow-y-auto">
            {reportedComments.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">No reported comments</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reporter</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportedComments.slice(0, 15).map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 text-foreground">{r.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === 'OPEN'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-foreground">{r.reporter || '-'}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(r.createdAt), 'MMM d')}</td>
                      <td className="p-3">
                        <CommentModeration
                          commentId={r.targetId}
                          status={r.commentStatus ?? 'ACTIVE'}
                          onStatusChange={() => setData((d) => d ? { ...d, reportedComments: (d.reportedComments ?? []).map((c) => c.id === r.id ? { ...c, commentStatus: 'REMOVED' } : c) } : null)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </PremiumCard>
        </div>
      </PremiumSection>

      <PremiumSection
        title="User Violations History"
        subtitle="Actions taken against users for policy violations"
        icon={AlertTriangle}
        gradient="from-amber-500 to-orange-600"
      >
        <PremiumCard variant="glass">
        <div className="overflow-x-auto">
            {violations.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">No violations recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-3">Action</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        {v.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/owner/dashboard/users/${v.targetUserId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {v.targetUser || v.targetUserId}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{format(new Date(v.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-3">
                      <Link
                        href={`/owner/dashboard/users/${v.targetUserId}`}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        Ban / Warn →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </PremiumCard>
      </PremiumSection>
    </div>
  );
}
