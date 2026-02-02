import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Eye, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import PostModeration from '@/features/owner/PostModeration';

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Posts</h1>
        <p className="text-gray-500">View all forum posts and engagement metrics</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search posts by title or content..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Showing {posts.length} of {total} posts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Title</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Author</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Category</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Views</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Comments</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Score</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Created</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="max-w-md">
                      <p className="font-medium text-gray-800 truncate">{post.title}</p>
                      {post.isAnonymous && (
                        <span className="text-xs text-orange-600 font-medium">Anonymous</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {post.author ? (
                      <Link
                        href={`/owner/dashboard/users/${post.author.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {post.author.profile?.displayName || post.author.email}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Deleted User</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        post.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : post.status === 'REMOVED'
                          ? 'bg-red-100 text-red-700'
                          : post.status === 'LOCKED'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye size={14} />
                      {post.viewCount}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MessageSquare size={14} />
                      {post._count.comments}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <ThumbsUp size={14} />
                      {post.voteScore}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
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
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/owner/dashboard/posts?page=${page - 1}&search=${search}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-600">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/owner/dashboard/posts?page=${page + 1}&search=${search}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
