'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Shield, FileText, Database } from 'lucide-react';
import Link from 'next/link';

interface GovernanceData {
  sensitiveAccessLogs: Array<{
    id: string;
    adminEmail: string;
    datasetName: string;
    actionType: string;
    accessedAt: string;
  }>;
  adminActionsAudit: Array<{
    id: string;
    actionType: string;
    targetType: string;
    targetId: string | null;
    createdAt: string;
  }>;
  dataExportRequests: number;
  dataDeleteRequests: number;
  dataRequests: Array<{
    id: string;
    requestType: string;
    status: string;
    createdAt: string;
  }>;
  consentRecordsCount: number;
  retentionStats: {
    totalUsers: number;
    inactiveUsers30Days: number;
    deletedPostsCount: number;
  };
}

export default function GovernancePage() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/governance')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Data Governance & Compliance</h1>
        <p className="text-slate-400 mt-1">Access logs, audit trail, and retention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <Shield className="text-emerald-400 mb-2" size={24} />
          <p className="text-slate-400 text-sm">Export Requests</p>
          <p className="text-2xl font-bold text-white">{data.dataExportRequests}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <Shield className="text-amber-400 mb-2" size={24} />
          <p className="text-slate-400 text-sm">Delete Requests</p>
          <p className="text-2xl font-bold text-white">{data.dataDeleteRequests}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <Database className="text-blue-400 mb-2" size={24} />
          <p className="text-slate-400 text-sm">Consent Records</p>
          <p className="text-2xl font-bold text-white">{data.consentRecordsCount}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <FileText className="text-violet-400 mb-2" size={24} />
          <p className="text-slate-400 text-sm">Inactive 30d</p>
          <p className="text-2xl font-bold text-white">{data.retentionStats?.inactiveUsers30Days ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-bold text-white">Sensitive Access Logs</h2>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {data.sensitiveAccessLogs.length === 0 ? (
              <p className="p-4 text-slate-500">No access logs</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-slate-400">
                    <th className="p-3">Admin</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sensitiveAccessLogs.map((l) => (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className="p-3 text-slate-300">{l.adminEmail}</td>
                      <td className="p-3 text-slate-400">{l.datasetName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">
                          {l.actionType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{format(new Date(l.accessedAt), 'MMM d')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-bold text-white">Admin Actions Audit</h2>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {data.adminActionsAudit.length === 0 ? (
              <p className="p-4 text-slate-500">No moderation actions</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-slate-400">
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.adminActionsAudit.map((a) => (
                    <tr key={a.id} className="border-b border-white/5">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                          {a.actionType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {a.targetType}:{a.targetId?.slice(0, 8)}
                      </td>
                      <td className="p-3 text-slate-500">{format(new Date(a.createdAt), 'MMM d')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/owner/dashboard/data/access-logs"
          className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
        >
          Full Audit Logs
        </Link>
      </div>
    </div>
  );
}
