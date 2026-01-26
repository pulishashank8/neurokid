import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, User, Activity } from 'lucide-react';

async function getActivityLogs(page: number = 1, action: string = '') {
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const where = action
    ? { action: { contains: action, mode: 'insensitive' as const } }
    : {};

  const [logs, total, actionTypes] = await Promise.all([
    prisma.auditLog.findMany({
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
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
  ]);

  return { logs, total, pageSize, page, actionTypes };
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const action = params.action || '';
  const { logs, total, pageSize, actionTypes } = await getActivityLogs(page, action);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
        <p className="text-gray-500">Track all user actions and audit events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
            <h2 className="font-semibold text-gray-800 mb-4">Top Actions</h2>
            <div className="space-y-2">
              <Link
                href="/owner/dashboard/activity"
                className={`block px-3 py-2 rounded-lg ${!action ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Actions
              </Link>
              {actionTypes.map((type) => (
                <Link
                  key={type.action}
                  href={`/owner/dashboard/activity?action=${encodeURIComponent(type.action)}`}
                  className={`block px-3 py-2 rounded-lg ${action === type.action ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{type.action}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{type._count}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {logs.length} of {total} activity logs
                </p>
                {action && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Filter:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {action}
                    </span>
                    <Link href="/owner/dashboard/activity" className="text-sm text-red-600 hover:text-red-800">
                      Clear
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg mt-1">
                        <Activity size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <User size={12} />
                          <Link
                            href={`/owner/dashboard/users/${log.user.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {log.user.profile?.displayName || log.user.email}
                          </Link>
                        </div>
                        {log.targetType && (
                          <p className="text-sm text-gray-500 mt-1">
                            Target: {log.targetType} ({log.targetId?.substring(0, 12)}...)
                          </p>
                        )}
                        {log.ipAddress && (
                          <p className="text-xs text-gray-400 mt-1">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={12} />
                      {format(log.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No activity logs found
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/owner/dashboard/activity?page=${page - 1}&action=${action}`}
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
                    href={`/owner/dashboard/activity?page=${page + 1}&action=${action}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
