import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  FileText,
  Download,
  Mail,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { ReportActions } from './ReportActions';

/**
 * Co-Founder AI Reports Dashboard
 *
 * View all past Co-Founder AI email reports with:
 * - Report history and timeline
 * - Executive summaries
 * - Download Excel/PDF attachments
 * - View embedded charts
 * - Resend option
 */

async function getCoFounderReports(page: number = 1) {
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [reports, total] = await Promise.all([
    prisma.coFounderReport.findMany({
      orderBy: { sentAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.coFounderReport.count(),
  ]);

  return { reports, total, pageSize, page };
}

export default async function CoFounderReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { reports, total, pageSize } = await getCoFounderReports(page);
  const totalPages = Math.ceil(total / pageSize);

  // Calculate stats
  const reportsToday = reports.filter(
    (r) => r.sentAt > new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const reportsThisWeek = reports.filter(
    (r) => r.sentAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Co-Founder AI Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Executive business intelligence reports from your AI Co-Founder
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/owner/dashboard"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            Back to Dashboard
          </Link>
          <ReportActions />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {total}
              </p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {reportsToday}
              </p>
            </div>
            <Activity className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {reportsThisWeek}
              </p>
            </div>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Frequency</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
                3x Daily
              </p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Report History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {reports.length} of {total} reports
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reports.map((report) => {
            const reportData = report.reportData as any;
            const kpis = reportData?.kpis || {};
            const hasCharts = report.attachmentUrls && report.attachmentUrls.length > 0;

            return (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Report Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          Co-Founder Report
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={14} />
                          {format(report.sentAt, 'MMM d, yyyy h:mm a')}
                          <span className="mx-2">&bull;</span>
                          <Mail size={14} />
                          Sent to {report.recipientEmail}
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {report.executiveSummary}
                      </p>
                    </div>

                    {/* KPI Preview */}
                    {Object.keys(kpis).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {kpis.totalUsers !== undefined && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              {kpis.totalUsers}
                            </p>
                          </div>
                        )}
                        {kpis.activeUsers7d !== undefined && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Active Users</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              {kpis.activeUsers7d}
                            </p>
                          </div>
                        )}
                        {(kpis.newSignupsToday !== undefined || kpis.newUsersToday !== undefined) && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">New Signups</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              {kpis.newSignupsToday ?? kpis.newUsersToday}
                            </p>
                          </div>
                        )}
                        {(kpis.uptime !== undefined || kpis.growthRate !== undefined) && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {kpis.uptime !== undefined ? 'Uptime' : 'Growth Rate'}
                            </p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              {kpis.uptime !== undefined ? `${kpis.uptime}%` : `${kpis.growthRate}%`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Charts Preview */}
                    {hasCharts && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-500" />
                          {report.attachmentUrls.length} chart
                          {report.attachmentUrls.length !== 1 ? 's' : ''} included
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - using Links instead of onClick for Server Component */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/api/owner/cofounder/reports/${report.id}/excel`}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Download size={14} />
                      Excel
                    </Link>
                    <Link
                      href={`/api/owner/cofounder/reports/${report.id}/pdf`}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Download size={14} />
                      PDF
                    </Link>
                    <Link
                      href={`/owner/dashboard/cofounder-reports/${report.id}`}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                    >
                      View Full
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle className="mx-auto text-gray-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-4">
                No Reports Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Co-Founder AI reports will appear here once generated.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Reports are sent automatically 3 times daily (0:00, 8:00, 16:00 UTC)
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/owner/dashboard/cofounder-reports?page=${page - 1}`}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/owner/dashboard/cofounder-reports?page=${page + 1}`}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
