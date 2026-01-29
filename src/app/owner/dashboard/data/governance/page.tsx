import { prisma } from '@/lib/prisma';
import { ShieldAlert, FileText, Lock } from 'lucide-react';
import { format } from 'date-fns';
import AuditDataForm from '@/components/owner/AuditDataForm';

async function getStats() {
    const [accessLogs, consentCounts] = await Promise.all([
        prisma.sensitiveAccessLog.findMany({
            take: 10,
            orderBy: { accessedAt: 'desc' },
            include: { adminUser: true }
        }),
        prisma.userConsent.groupBy({
            by: ['consentType'],
            _count: { userId: true },
            where: { hasGranted: true }
        })
    ]);
    return { accessLogs, consentCounts };
}

export default async function GovernancePage() {
    const { accessLogs, consentCounts } = await getStats();

    return (
        <div className="space-y-8">

            {/* Policy & Consent Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                        <FileText size={20} className="text-blue-400" />
                        Active Consents
                    </h3>
                    <div className="space-y-4">
                        {consentCounts.length === 0 ? (
                            <p className="text-slate-500 text-sm">No user consents recorded yet.</p>
                        ) : (
                            consentCounts.map((c) => (
                                <div key={c.consentType} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-slate-300 capitalize">{c.consentType.replace('_', ' ')}</span>
                                    <span className="font-mono text-emerald-400 font-bold">{c._count.userId} users</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <AuditDataForm />
            </div>

            {/* Sensitive Access Logs */}
            <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <Lock size={20} className="text-red-400" />
                    Sensitive Data Access Logs
                </h2>

                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Admin User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Dataset</th>
                                <th className="px-6 py-4">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {accessLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 text-slate-500 font-mono">
                                        {format(log.accessedAt, 'yyyy-MM-dd HH:mm:ss')}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {log.adminUser.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${log.actionType === 'EXPORT' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {log.actionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{log.datasetName}</td>
                                    <td className="px-6 py-4 text-slate-400 italic">{log.reason || '-'}</td>
                                </tr>
                            ))}
                            {accessLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        <ShieldAlert size={24} className="mx-auto mb-2 opacity-50" />
                                        No sensitive data access recorded recently.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
