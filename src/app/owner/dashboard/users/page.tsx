import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Eye, Mail, Calendar, Clock } from 'lucide-react';

async function getUsers(page: number = 1, search: string = '') {
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { profile: { username: { contains: search, mode: 'insensitive' as const } } },
          { profile: { displayName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
        userRoles: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            votes: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, pageSize, page };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const { users, total, pageSize } = await getUsers(page, search);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <p className="text-gray-500">View all registered users and their activity</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by email, username, or name..."
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
            Showing {users.length} of {total} users
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Roles</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Posts</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Comments</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Votes</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Last Login</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Joined</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">
                      {user.profile?.displayName || 'No Name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.profile?.username || 'no-username'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    {user.emailVerified && (
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles.map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                        >
                          {role.role}
                        </span>
                      ))}
                      {user.userRoles.length === 0 && (
                        <span className="text-gray-400 text-sm">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user._count.posts}</td>
                  <td className="py-3 px-4 text-gray-600">{user._count.comments}</td>
                  <td className="py-3 px-4 text-gray-600">{user._count.votes}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      {user.lastLoginAt
                        ? format(user.lastLoginAt, 'MMM d, yyyy')
                        : 'Never'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {format(user.createdAt, 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/owner/dashboard/users/${user.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} />
                      View
                    </Link>
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
                href={`/owner/dashboard/users?page=${page - 1}&search=${search}`}
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
                href={`/owner/dashboard/users?page=${page + 1}&search=${search}`}
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
