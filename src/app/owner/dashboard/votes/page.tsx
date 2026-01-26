import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Clock, FileText, MessageSquare } from 'lucide-react';

async function getVotes(page: number = 1, type: string = '') {
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const where = type && (type === 'POST' || type === 'COMMENT')
    ? { targetType: type as 'POST' | 'COMMENT' }
    : {};

  const [votes, total, stats] = await Promise.all([
    prisma.vote.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { profile: true },
        },
      },
    }),
    prisma.vote.count({ where }),
    prisma.vote.groupBy({
      by: ['targetType', 'value'],
      _count: true,
    }),
  ]);

  const postUpvotes = stats.find(s => s.targetType === 'POST' && s.value === 1)?._count || 0;
  const postDownvotes = stats.find(s => s.targetType === 'POST' && s.value === -1)?._count || 0;
  const commentUpvotes = stats.find(s => s.targetType === 'COMMENT' && s.value === 1)?._count || 0;
  const commentDownvotes = stats.find(s => s.targetType === 'COMMENT' && s.value === -1)?._count || 0;

  return { votes, total, pageSize, page, postUpvotes, postDownvotes, commentUpvotes, commentDownvotes };
}

export default async function VotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const type = params.type || '';
  const { votes, total, pageSize, postUpvotes, postDownvotes, commentUpvotes, commentDownvotes } = await getVotes(page, type);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Votes & Likes</h1>
        <p className="text-gray-500">Track all voting activity across posts and comments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ThumbsUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{postUpvotes}</p>
              <p className="text-sm text-gray-500">Post Upvotes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <ThumbsDown className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{postDownvotes}</p>
              <p className="text-sm text-gray-500">Post Downvotes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ThumbsUp className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{commentUpvotes}</p>
              <p className="text-sm text-gray-500">Comment Upvotes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ThumbsDown className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{commentDownvotes}</p>
              <p className="text-sm text-gray-500">Comment Downvotes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Link
              href="/owner/dashboard/votes"
              className={`px-4 py-2 rounded-lg ${!type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </Link>
            <Link
              href="/owner/dashboard/votes?type=POST"
              className={`px-4 py-2 rounded-lg ${type === 'POST' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Posts Only
            </Link>
            <Link
              href="/owner/dashboard/votes?type=COMMENT"
              className={`px-4 py-2 rounded-lg ${type === 'COMMENT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Comments Only
            </Link>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Showing {votes.length} of {total} votes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Vote</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Target ID</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote) => (
                <tr key={vote.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/owner/dashboard/users/${vote.user.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {vote.user.profile?.displayName || vote.user.email}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {vote.targetType === 'POST' ? (
                        <>
                          <FileText size={14} className="text-gray-400" />
                          <span className="text-gray-600">Post</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare size={14} className="text-gray-400" />
                          <span className="text-gray-600">Comment</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {vote.value === 1 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <ThumbsUp size={14} />
                        Upvote
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <ThumbsDown size={14} />
                        Downvote
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-sm">
                    {vote.targetId.substring(0, 12)}...
                  </td>
                  <td className="py-3 px-4 text-gray-600">
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
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/owner/dashboard/votes?page=${page - 1}&type=${type}`}
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
                href={`/owner/dashboard/votes?page=${page + 1}&type=${type}`}
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
