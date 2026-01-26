import { prisma } from '@/lib/prisma';
import { format, subDays, startOfDay } from 'date-fns';
import { Users, FileText, MessageSquare, Heart, Activity, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

const statCards = [
  { key: 'totalUsers', title: 'Total Users', weekKey: 'newUsersWeek', icon: Users, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
  { key: 'activeUsersWeek', title: 'Active Users', subtitle: 'Last 7 days', icon: Activity, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
  { key: 'newUsersToday', title: 'New Today', icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20' },
  { key: 'totalPosts', title: 'Total Posts', weekKey: 'postsThisWeek', icon: FileText, gradient: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/20' },
  { key: 'totalComments', title: 'Total Comments', weekKey: 'commentsThisWeek', icon: MessageSquare, gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20' },
  { key: 'totalVotes', title: 'Total Votes', icon: Heart, gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/20' },
];

export default async function OwnerDashboardPage() {
  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Owner Access</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome back. Here's what's happening with NeuroKid.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {statCards.map((card) => {
          const value = stats[card.key as keyof typeof stats] as number;
          const weekValue = card.weekKey ? stats[card.weekKey as keyof typeof stats] as number : null;
          const Icon = card.icon;
          
          return (
            <div 
              key={card.key}
              className={`group relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-xl ${card.glow}`}
            >
              {/* Gradient orb */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-4xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
                  {weekValue !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-emerald-400 text-sm font-semibold">+{weekValue}</span>
                      <span className="text-slate-500 text-sm">this week</span>
                    </div>
                  )}
                  {card.subtitle && (
                    <p className="text-slate-500 text-sm mt-2">{card.subtitle}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.glow}`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Logins Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Logins</h2>
              <p className="text-slate-400 text-sm">Latest user activity</p>
            </div>
            <Link 
              href="/owner/dashboard/users" 
              className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              View All Users
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm uppercase tracking-wider">Last Login</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogins.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    index === 0 ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {(user.profile?.displayName || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {user.profile?.displayName || user.profile?.username || 'Anonymous'}
                        </div>
                        <div className="text-sm text-slate-500">
                          @{user.profile?.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">{user.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
                      index === 0 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-slate-400'
                    }`}>
                      {user.lastLoginAt ? format(user.lastLoginAt, 'MMM d, h:mm a') : 'Never'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
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
