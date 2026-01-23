import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Dashboard | NeuroKind",
  description: "Enterprise admin console for NeuroKind data platform",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    userCount,
    postCount,
    reportCount,
    users,
    recentPosts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { profile: true }
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { include: { profile: true } } }
    })
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Overview of your NeuroKind community
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {userCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {postCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Open Reports
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {reportCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚩</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {user.profile?.username || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Posts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((post) => (
                    <tr key={post.id} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        <Link href={`/community/${post.id}`} className="hover:text-blue-500 hover:underline">
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {post.author?.profile?.username || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${post.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {post.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
