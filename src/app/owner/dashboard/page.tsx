import { prisma } from '@/lib/prisma';
import { format, subDays, startOfDay } from 'date-fns';
import { Users, FileText, MessageSquare, Heart, Activity, TrendingUp } from 'lucide-react';

async function getStats() {
  const now = new Date();
  const today = startOfDay(now);
  const last7Days = subDays(today, 7);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    activeUsersWeek,
    totalPosts,
    postsThisWeek,
    totalComments,
    commentsThisWeek,
    totalVotes,
    recentLogins,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: last7Days } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.vote.count(),
    prisma.user.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' },
      take: 10,
      include: { profile: true },
    }),
  ]);

  return {
    totalUsers,
    newUsersToday,
    newUsersWeek,
    activeUsersWeek,
    totalPosts,
    postsThisWeek,
    totalComments,
    commentsThisWeek,
    totalVotes,
    recentLogins,
  };
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  subtitle?: string; 
  icon: React.ElementType; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}

export default async function OwnerDashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to the NeuroKid Owner Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`+${stats.newUsersWeek} this week`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users (7 days)"
          value={stats.activeUsersWeek}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="New Users Today"
          value={stats.newUsersToday}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          subtitle={`+${stats.postsThisWeek} this week`}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Total Comments"
          value={stats.totalComments}
          subtitle={`+${stats.commentsThisWeek} this week`}
          icon={MessageSquare}
          color="pink"
        />
        <StatCard
          title="Total Votes"
          value={stats.totalVotes}
          icon={Heart}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Logins</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Last Login</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogins.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">
                      {user.profile?.displayName || user.profile?.username || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.profile?.username || 'no-username'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {user.lastLoginAt ? format(user.lastLoginAt, 'MMM d, yyyy h:mm a') : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {format(user.createdAt, 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
