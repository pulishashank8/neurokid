import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import CommentModeration from '@/features/owner/CommentModeration';
import {
  PremiumPageHeader,
  PremiumCard,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

async function getComments(page: number = 1, search: string = '') {
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        content: { contains: search, mode: 'insensitive' as const },
      }
    : {};

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: { profile: true },
        },
        post: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, pageSize, page };
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const { comments, total, pageSize } = await getComments(page, search);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Comments Management"
        subtitle="View all comments across the platform"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Comments' },
        ]}
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
      />

      <PremiumCard variant="glass">
        <div className="p-4 border-b border-border">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search comments..."
              className="flex-1 px-4 py-2.5 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <PremiumButton type="submit" variant="secondary">
              <MessageSquare className="w-4 h-4" />
              Search
            </PremiumButton>
          </form>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Showing {comments.length} of {total} comments
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Content</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Author</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Post</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Score</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Created</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="max-w-lg">
                      <p className="text-foreground line-clamp-2">{comment.content}</p>
                      {comment.isAnonymous && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Anonymous</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/owner/dashboard/users/${comment.author.id}`}
                      className="text-primary hover:underline"
                    >
                      {comment.author.profile?.displayName || comment.author.email}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-muted-foreground truncate max-w-xs" title={comment.post.title}>
                      {comment.post.title}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        comment.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : comment.status === 'REMOVED'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp size={14} />
                      {comment.voteScore}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(comment.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <CommentModeration 
                      commentId={comment.id} 
                      status={comment.status} 
                    />
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
                href={`/owner/dashboard/comments?page=${page - 1}&search=${search}`}
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
                href={`/owner/dashboard/comments?page=${page + 1}&search=${search}`}
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
