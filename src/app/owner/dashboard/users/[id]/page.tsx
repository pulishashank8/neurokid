import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Calendar, Clock, FileText, MessageSquare, Heart } from 'lucide-react';

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      userRoles: true,
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { category: true },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { post: true },
      },
      votes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: {
        select: {
          posts: true,
          comments: true,
          votes: true,
          aiConversations: true,
        },
      },
    },
  });

  return user;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/owner/dashboard/users"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {user.profile?.displayName || 'Anonymous User'}
        </h1>
        <p className="text-gray-500">@{user.profile?.username || 'no-username'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">User Info</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">{user.email}</p>
                {user.emailVerified && (
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-800">{format(user.createdAt, 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-gray-800">
                  {user.lastLoginAt
                    ? format(user.lastLoginAt, 'MMMM d, yyyy h:mm a')
                    : 'Never'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Roles</p>
              <div className="flex flex-wrap gap-1">
                {user.userRoles.map((role) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                  >
                    {role.role}
                  </span>
                ))}
                {user.userRoles.length === 0 && (
                  <span className="text-gray-400 text-sm">No roles assigned</span>
                )}
              </div>
            </div>
            {user.profile?.bio && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Bio</p>
                <p className="text-gray-700 text-sm">{user.profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Activity Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-2xl font-bold text-gray-800">{user._count.posts}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-2xl font-bold text-gray-800">{user._count.comments}</p>
              <p className="text-sm text-gray-500">Comments</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <Heart className="mx-auto mb-2 text-pink-500" size={24} />
              <p className="text-2xl font-bold text-gray-800">{user._count.votes}</p>
              <p className="text-sm text-gray-500">Votes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="mx-auto mb-2 text-purple-500" size={24} />
              <p className="text-2xl font-bold text-gray-800">{user._count.aiConversations}</p>
              <p className="text-sm text-gray-500">AI Chats</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Profile Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Username</p>
              <p className="text-gray-800">@{user.profile?.username || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Display Name</p>
              <p className="text-gray-800">{user.profile?.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p className="text-gray-800">{user.profile?.location || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Verified Therapist</p>
              <p className="text-gray-800">{user.profile?.verifiedTherapist ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-gray-500">Shadowbanned</p>
              <p className={user.profile?.shadowbanned ? 'text-red-600 font-medium' : 'text-gray-800'}>
                {user.profile?.shadowbanned ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Posts ({user._count.posts} total)</h2>
          {user.posts.length > 0 ? (
            <div className="space-y-3">
              {user.posts.map((post) => (
                <div key={post.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="font-medium text-gray-800">{post.title}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{post.category.name}</span>
                    <span>{format(post.createdAt, 'MMM d, yyyy')}</span>
                    <span>{post.viewCount} views</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No posts yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Comments ({user._count.comments} total)</h2>
          {user.comments.length > 0 ? (
            <div className="space-y-3">
              {user.comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="text-gray-700 text-sm line-clamp-2">{comment.content}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>On: {comment.post.title.substring(0, 30)}...</span>
                    <span>{format(comment.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No comments yet</p>
          )}
        </div>
      </div>

      {user.auditLogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {user.auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-gray-800">{log.action}</p>
                  {log.targetType && (
                    <p className="text-sm text-gray-500">
                      {log.targetType}: {log.targetId?.substring(0, 8)}...
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {format(log.createdAt, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
