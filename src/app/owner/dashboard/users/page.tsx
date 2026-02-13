import { prisma } from '@/lib/prisma';
import { FormattedDate } from '@/components/shared/FormattedDate';
import Link from 'next/link';
import { Eye, Mail, Calendar, Clock, Search } from 'lucide-react';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';
import { PremiumPageHeader } from '@/components/owner/PremiumSection';
import { UserListActions } from './UserListActions';

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
    <div className="space-y-8">
      {/* Premium Page Header */}
      <PremiumPageHeader
        title="User Management"
        subtitle={`Manage ${total.toLocaleString()} registered users and monitor their activity`}
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Users' }
        ]}
        actions={<UserListActions />}
        gradient="from-emerald-500 via-teal-500 to-cyan-600"
      />

      {/* Search & Data Table */}
      <PremiumCard variant="glass" noPadding className="overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-border">
          <form method="GET" className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by email, username, or name..."
              className="flex-1 px-4 py-2.5 bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
            <PremiumButton type="submit" variant="success">
              <Search className="w-4 h-4" />
              Search
            </PremiumButton>
          </form>
        </div>

        <div className="p-4 lg:px-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{users.length}</span> of <span className="text-foreground font-medium">{total}</span> users
          </p>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Roles</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">Stats</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Last Activity</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-accent/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        {user.profile?.displayName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {user.profile?.displayName || 'No Name'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{user.profile?.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail size={14} className="text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.emailVerified && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">Verified</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {user.userRoles.map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        >
                          {role.role}
                        </span>
                      ))}
                      {user.userRoles.length === 0 && (
                        <span className="text-slate-600 text-xs italic">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-4 text-muted-foreground">
                      <div className="text-center" title="Posts">
                        <div className="text-white font-bold text-sm">{user._count.posts}</div>
                        <div className="text-[10px] uppercase">P</div>
                      </div>
                      <div className="text-center" title="Comments">
                        <div className="text-white font-bold text-sm">{user._count.comments}</div>
                        <div className="text-[10px] uppercase">C</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={12} className="text-muted-foreground" />
                        {user.lastLoginAt ? <FormattedDate date={user.lastLoginAt} style="date" /> : 'Never'}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={12} />
                        Joined <FormattedDate date={user.createdAt} style="dateShort" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Link 
                      href={`/owner/dashboard/users/${user.id}`}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-out"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-2">
            {page > 1 && (
              <Link href={`/owner/dashboard/users?page=${page - 1}&search=${search}`}>
                <PremiumButton variant="secondary" size="sm">
                  Previous
                </PremiumButton>
              </Link>
            )}
            <span className="px-4 py-2 text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/owner/dashboard/users?page=${page + 1}&search=${search}`}>
                <PremiumButton variant="secondary" size="sm">
                  Next
                </PremiumButton>
              </Link>
            )}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
