import { prisma } from '@/lib/prisma';
import PlatformQualityMetrics from './PlatformQualityMetrics';
import CheckRunner from './check-runner';
import { ShieldCheck, AlertCircle, CheckCircle2, Zap, BarChart3, Search, Activity, RefreshCw, XCircle, AlertTriangle, Database } from 'lucide-react';
import { format } from 'date-fns';

async function getQualityResults() {
    return await prisma.dataQualityResult.findMany({
        take: 20,
        orderBy: { runDate: 'desc' },
        include: {
            rule: {
                include: { dataset: true }
            }
        }
    });
}

export default async function DataQualityPage() {
    const results = await getQualityResults();
    const failureCount = results.filter((r: any) => r.status === 'FAIL').length;
    const anomalyFound = results.some((r: any) => r.rule.ruleType === 'ANOMALY_DETECTION' && r.status === 'FAIL');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Data Quality & <span className="text-emerald-400 font-black tracking-widest">ML OPS</span></h1>
                    <p className="text-gray-600 dark:text-slate-400 font-medium font-inter">Automated Z-Score Anomaly Detection and Healthcare Rule Validation.</p>
                </div>
                <CheckRunner />
            </div>

            <PlatformQualityMetrics />

            {/* ML Insight Banner (Conditional) */}
            {anomalyFound ? (
                <div className="bg-white dark:bg-slate-900 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-red-500/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 underline decoration-red-500/50 decoration-4 underline-offset-4">ML Anomaly Detected: Critical Drift</h3>
                            <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
                                Statistical engine detected a significant deviation in recent processing runs. This suggest potential <span className="text-red-400 font-bold">Data Poisoning</span> or <span className="text-red-400 font-bold">Integration Failure</span> in sensitive healthcare pipelines.
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-red-500 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                            Drill Down Analysis
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={32} />
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 underline decoration-emerald-500/50 decoration-4 underline-offset-4">Governance Health: Optimal</h3>
                            <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
                                All automated quality controls are currently within the 95th percentile of expected statistical bounds. No high-confidence anomalies detected in the last <span className="text-gray-900 dark:text-white font-bold">24 hours</span>.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                                <span className="text-xs text-gray-500 dark:text-slate-500 font-bold uppercase">Uptime</span>
                                <span className="text-sm font-black text-emerald-400 tracking-tighter">100%</span>
                            </div>
                            <div className="flex flex-col items-center px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                                <span className="text-xs text-gray-500 dark:text-slate-500 font-bold uppercase">Alerts</span>
                                <span className="text-sm font-black text-gray-700 dark:text-slate-300 tracking-tighter">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules Table */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/[0.01]">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Quality Execution Registry</h3>
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-slate-500">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Pass: {results.length - failureCount}</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Fail: {failureCount}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Verification Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Data Asset & Rule</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Detection Logic</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em] text-center">ML Score</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Records Check</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.map((res) => (
                                <tr key={res.id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            {res.status === 'PASS' ? (
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 animate-pulse">
                                                    <AlertCircle size={16} />
                                                </div>
                                            )}
                                            <span className={`text-xs font-black uppercase tracking-widest ${res.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{res.rule.name}</div>
                                        <div className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                            <Database size={10} /> {res.rule.dataset.name}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-slate-400">
                                                {res.rule.ruleType}
                                            </span>
                                            {res.rule.ruleType === 'ANOMALY_DETECTION' && (
                                                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                                    AI POWERED
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-sm font-black tabular-nums ${res.anomalyScore && res.anomalyScore > 2 ? 'text-amber-500' : 'text-gray-600 dark:text-slate-400'}`}>
                                                {res.anomalyScore ? res.anomalyScore.toFixed(3) : '–'}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">Z-Score</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-sm font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                                            {res.recordsChecked.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase">Rows Validated</div>
                                    </td>
                                </tr>
                            ))}
                            {results.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Search size={48} className="text-gray-500 dark:text-slate-500 mb-4" />
                                            <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">No Execution History</p>
                                            <p className="text-gray-500 dark:text-slate-500 text-sm font-medium">Global integrity scanner is awaiting manual trigger.</p>
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
