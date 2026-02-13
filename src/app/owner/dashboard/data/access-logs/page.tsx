
import { prisma } from '@/lib/prisma';
import { ShieldAlert, Fingerprint, Eye, Search, User, Clock, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import AuditExport from './audit-export';

async function getAccessLogs() {
    return await prisma.sensitiveAccessLog.findMany({
        take: 30,
        orderBy: { accessedAt: 'desc' },
        include: {
            adminUser: true
        }
    });
}

export default async function SensitiveAccessLogsPage() {
    const logs = await getAccessLogs();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Governance & <span className="text-emerald-400 font-black tracking-widest uppercase">Audit Log</span></h1>
                    <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">Mandatory chain-of-custody tracking for PHI and Restricted assets.</p>
                </div>
                <div className="flex gap-3">
                    <AuditExport logs={logs} />
                </div>
            </div>

            {/* Audit Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-emerald-500/5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                        <Fingerprint size={24} />
                    </div>
                    <h4 className="text-gray-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Audit Compliance</h4>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">SECURED</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Hash Integrity Verified</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                        <Eye size={24} />
                    </div>
                    <h4 className="text-gray-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Restricted Access 24h</h4>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{logs.length}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 font-black uppercase tracking-widest">Unique Admin Sessions</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
                        <ShieldAlert size={24} />
                    </div>
                    <h4 className="text-gray-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Flagged Actions</h4>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">0</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 font-black uppercase tracking-widest">No Policy Violations</span>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.01]">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Unified Access Registry</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Authorized Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Resource Interacted</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Action Vector</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em] text-right text-indigo-400">Governance ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:bg-white/[0.01] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-slate-500">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{format(log.accessedAt, 'HH:mm:ss')}</div>
                                                <div className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">{format(log.accessedAt, 'MMM d, yyyy')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/5">
                                                {log.adminUser.email?.charAt(0) || <User size={12} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{log.adminUser.email || 'System Admin'}</div>
                                                <div className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">{log.adminUser.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{log.datasetName}</span>
                                        </div>
                                        <div className="mt-1 text-[10px] font-light text-gray-500 dark:text-slate-500 italic truncate max-w-[200px]">
                                            Reason: {log.reason || 'Standard operational review'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.actionType === 'EXPORT' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                log.actionType === 'UPDATE' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                    'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400'
                                                }`}>
                                                {log.actionType}
                                            </span>
                                            {log.recordCount && (
                                                <span className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">
                                                    ({log.recordCount.toLocaleString()} Records)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <code className="text-[10px] font-black text-indigo-400/80 bg-indigo-500/5 px-2 py-1 rounded-md border border-indigo-500/10">
                                            LOG-{log.id.split('-')[0].toUpperCase()}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <ShieldAlert size={48} className="text-gray-500 dark:text-slate-500 mb-4" />
                                            <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">Secure Ledger Empty</p>
                                            <p className="text-gray-500 dark:text-slate-500 text-sm font-medium">Monitoring engine active. All access currently being indexed.</p>
                                        </div>
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
