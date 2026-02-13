'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Clock, FileText, MessageSquare } from 'lucide-react';
import { PremiumCard, PremiumStatCard } from '@/components/owner/PremiumCard';
import { PremiumPageHeader, PremiumGrid } from '@/components/owner/PremiumSection';

interface Vote {
  id: string;
  userId: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  value: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
}

interface VotesData {
  votes: Vote[];
  total: number;
  pageSize: number;
  page: number;
  postUpvotes: number;
  postDownvotes: number;
  commentUpvotes: number;
  commentDownvotes: number;
}

export default function VotesPage() {
  const [data, setData] = useState<VotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = parseInt(params.get('page') || '1');
    const typeParam = params.get('type') || '';
    setPage(pageParam);
    setType(typeParam);

    const query = new URLSearchParams({ page: pageParam.toString() });
    if (typeParam) query.set('type', typeParam);

    fetch(`/api/owner/votes?${query}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { votes, total, pageSize, postUpvotes = 0, postDownvotes = 0, commentUpvotes = 0, commentDownvotes = 0 } = data;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Votes & Likes"
        subtitle="Track all voting activity across posts and comments"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Votes' }
        ]}
        gradient="from-pink-600 via-rose-600 to-red-600"
      />

      <PremiumGrid cols={4}>
        <PremiumStatCard
          title="Post Upvotes"
          value={(postUpvotes ?? 0).toString()}
          icon={<ThumbsUp className="w-6 h-6" />}
          gradient="from-emerald-500 to-teal-600"
        />
        <PremiumStatCard
          title="Post Downvotes"
          value={(postDownvotes ?? 0).toString()}
          icon={<ThumbsDown className="w-6 h-6" />}
          gradient="from-rose-500 to-red-600"
        />
        <PremiumStatCard
          title="Comment Upvotes"
          value={(commentUpvotes ?? 0).toString()}
          icon={<ThumbsUp className="w-6 h-6" />}
          gradient="from-blue-500 to-indigo-600"
        />
        <PremiumStatCard
          title="Comment Downvotes"
          value={(commentDownvotes ?? 0).toString()}
          icon={<ThumbsDown className="w-6 h-6" />}
          gradient="from-orange-500 to-amber-600"
        />
      </PremiumGrid>

      <PremiumCard variant="glass">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex gap-2">
            <Link
              href="/owner/dashboard/votes"
              className={`px-4 py-2 rounded-lg transition-colors ${!type ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'bg-muted text-foreground hover:bg-accent'}`}
            >
              All
            </Link>
            <Link
              href="/owner/dashboard/votes?type=POST"
              className={`px-4 py-2 rounded-lg transition-colors ${type === 'POST' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'bg-muted text-foreground hover:bg-accent'}`}
            >
              Posts Only
            </Link>
            <Link
              href="/owner/dashboard/votes?type=COMMENT"
              className={`px-4 py-2 rounded-lg transition-colors ${type === 'COMMENT' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'bg-muted text-foreground hover:bg-accent'}`}
            >
              Comments Only
            </Link>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Showing {votes.length} of {total} votes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Type</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Vote</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Target ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote) => (
                <tr key={vote.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      href={`/owner/dashboard/users/${vote.user.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {vote.user.profile?.displayName || vote.user.email}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {vote.targetType === 'POST' ? (
                        <>
                          <FileText size={14} className="text-muted-foreground" />
                          <span className="text-foreground">Post</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare size={14} className="text-muted-foreground" />
                          <span className="text-foreground">Comment</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {vote.value === 1 ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp size={14} />
                        Upvote
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <ThumbsDown size={14} />
                        Downvote
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                    {vote.targetId.substring(0, 12)}...
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(vote.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-3 bg-muted/20">
            {page > 1 && (
              <Link
                href={`/owner/dashboard/votes?page=${page - 1}&type=${type}`}
                className="px-4 py-2 border border-border bg-background/50 backdrop-blur-sm rounded-xl text-foreground hover:bg-accent transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/owner/dashboard/votes?page=${page + 1}&type=${type}`}
                className="px-4 py-2 border border-border bg-background/50 backdrop-blur-sm rounded-xl text-foreground hover:bg-accent transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
