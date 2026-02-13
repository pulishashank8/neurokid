import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Eye, MessageSquare, ThumbsUp, Clock, FileText } from 'lucide-react';
import PostModeration from '@/features/owner/PostModeration';
import {
  PremiumPageHeader,
  PremiumCard,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

async function getPosts(page: number = 1, search: string = '') {
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: { profile: true },
        },
        category: true,
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, pageSize, page };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const { posts, total, pageSize } = await getPosts(page, search);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Posts Management"
        subtitle="View all forum posts and engagement metrics"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Posts' },
        ]}
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      <PremiumCard variant="glass">
        <div className="p-4 border-b border-border">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search posts by title or content..."
              className="flex-1 px-4 py-2.5 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <PremiumButton type="submit" variant="secondary">
              <FileText className="w-4 h-4" />
              Search
            </PremiumButton>
          </form>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Showing {posts.length} of {total} posts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Title</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Author</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Category</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Views</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Comments</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Score</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Created</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="max-w-md">
                      <p className="font-medium text-foreground truncate">{post.title}</p>
                      {post.isAnonymous && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Anonymous</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {post.author ? (
                      <Link
                        href={`/owner/dashboard/users/${post.author.id}`}
                        className="text-primary hover:underline"
                      >
                        {post.author.profile?.displayName || post.author.email}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Deleted User</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-foreground">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        post.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : post.status === 'REMOVED'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : post.status === 'LOCKED'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye size={14} />
                      {post.viewCount}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare size={14} />
                      {post._count.comments}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp size={14} />
                      {post.voteScore}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(post.createdAt, 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <PostModeration 
                      postId={post.id} 
                      status={post.status} 
                      isLocked={post.isLocked} 
                      isPinned={post.isPinned} 
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
                href={`/owner/dashboard/posts?page=${page - 1}&search=${search}`}
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
                href={`/owner/dashboard/posts?page=${page + 1}&search=${search}`}
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
