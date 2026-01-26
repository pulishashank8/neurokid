import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, ThumbsUp } from 'lucide-react';

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Comments</h1>
        <p className="text-gray-500">View all comments across the platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search comments..."
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
            Showing {comments.length} of {total} comments
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Content</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Author</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Post</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Score</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Created</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="max-w-lg">
                      <p className="text-gray-800 line-clamp-2">{comment.content}</p>
                      {comment.isAnonymous && (
                        <span className="text-xs text-orange-600 font-medium">Anonymous</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/owner/dashboard/users/${comment.author.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {comment.author.profile?.displayName || comment.author.email}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-600 truncate max-w-xs" title={comment.post.title}>
                      {comment.post.title}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        comment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : comment.status === 'REMOVED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <ThumbsUp size={14} />
                      {comment.voteScore}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(comment.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
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
                href={`/owner/dashboard/comments?page=${page - 1}&search=${search}`}
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
                href={`/owner/dashboard/comments?page=${page + 1}&search=${search}`}
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
