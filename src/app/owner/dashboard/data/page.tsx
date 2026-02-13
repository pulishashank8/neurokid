import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Shield,
  Database,
  Activity,
  GitBranch,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lock,
  TrendingUp,
  Eye,
} from 'lucide-react';

async function getGovernanceMetrics() {
  // Catalog metrics
  const totalDatasets = await prisma.dataset.count();
  const totalFields = await prisma.datasetField.count();
  const phiDatasets = await prisma.dataset.count({ where: { sensitivity: 'PHI' } });
  const piiDatasets = await prisma.dataset.count({ where: { sensitivity: 'PII' } });

  // Quality metrics
  const totalRules = await prisma.dataQualityRule.count({ where: { isActive: true } });
  const latestResults = await prisma.dataQualityResult.findMany({
    take: 100,
    orderBy: { runDate: 'desc' },
    distinct: ['ruleId'],
  });
  const passCount = latestResults.filter(r => r.status === 'PASS').length;
  const qualityScore = latestResults.length > 0
    ? Math.round((passCount / latestResults.length) * 100)
    : 100;

  // Lineage metrics
  const totalNodes = await prisma.dataLineageNode.count();
  const totalEdges = await prisma.dataLineageEdge.count();

  // Compliance metrics
  const totalUsers = await prisma.user.count();
  const sensitiveAccesses = await prisma.sensitiveAccessLog.count({
    where: {
      accessedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return {
    catalog: { totalDatasets, totalFields, phiDatasets, piiDatasets },
    quality: { totalRules, qualityScore, passCount, total: latestResults.length },
    lineage: { totalNodes, totalEdges },
    compliance: { totalUsers, sensitiveAccesses },
  };
}

export default async function DataGovernancePage() {
  const metrics = await getGovernanceMetrics();

  // Calculate overall health score
  const healthScore = Math.round(
    (metrics.quality.qualityScore * 0.4) +
    (metrics.catalog.totalDatasets > 0 ? 30 : 0) +
    (metrics.lineage.totalEdges > 0 ? 20 : 0) +
    10
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Data <span className="text-emerald-500 dark:text-emerald-400 font-black tracking-widest uppercase">Governance</span> Command Center
          </h1>
          <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
            Enterprise data governance for autism healthcare data management
          </p>
        </div>
        <div className={`px-5 py-3 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
          healthScore >= 80
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : healthScore >= 60
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <TrendingUp size={18} />
          <span className="uppercase tracking-widest text-xs">Governance Health:</span>
          <span className="text-2xl font-black">{healthScore}%</span>
        </div>
      </div>

      {/* PHI Alert Banner (if PHI data exists) */}
      {metrics.catalog.phiDatasets > 0 && (
        <div className="bg-red-50 dark:bg-slate-900 border border-red-300 dark:border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500 border border-red-300 dark:border-red-500/20">
              <Lock size={32} />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                <span className="text-red-600 dark:text-red-500">{metrics.catalog.phiDatasets}</span> PHI Datasets Under Governance
              </h3>
              <p className="text-gray-700 dark:text-slate-400 font-medium leading-relaxed">
                Protected Health Information detected in your data catalog. HIPAA compliance monitoring is active.
                All access is logged and auditable.
              </p>
            </div>
            <Link
              href="/owner/dashboard/data/catalog"
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              View PHI Inventory
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Catalog */}
        <Link href="/owner/dashboard/data/catalog" className="group">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Database size={24} />
            </div>
            <h4 className="text-gray-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Data Catalog</h4>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{metrics.catalog.totalDatasets}</p>
            <p className="text-gray-500 dark:text-slate-500 text-xs font-medium mt-2">
              {metrics.catalog.totalFields} fields documented
            </p>
          </div>
        </Link>

        {/* Quality */}
        <Link href="/owner/dashboard/data/quality" className="group">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
            <h4 className="text-gray-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Quality Score</h4>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{metrics.quality.qualityScore}%</p>
            <p className="text-gray-500 dark:text-slate-500 text-xs font-medium mt-2">
              {metrics.quality.passCount}/{metrics.quality.total} rules passing
            </p>
          </div>
        </Link>

        {/* Lineage */}
        <Link href="/owner/dashboard/data/lineage" className="group">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-violet-500/30 transition-all hover:shadow-2xl hover:shadow-violet-500/5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <GitBranch size={24} />
            </div>
            <h4 className="text-gray-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Data Lineage</h4>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{metrics.lineage.totalNodes}</p>
            <p className="text-gray-500 dark:text-slate-500 text-xs font-medium mt-2">
              {metrics.lineage.totalEdges} data flows mapped
            </p>
          </div>
        </Link>

        {/* Audit */}
        <Link href="/owner/dashboard/data/access-logs" className="group">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-rose-500/30 transition-all hover:shadow-2xl hover:shadow-rose-500/5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 group-hover:scale-110 transition-transform">
              <Eye size={24} />
            </div>
            <h4 className="text-gray-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Audit Logs</h4>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{metrics.compliance.sensitiveAccesses}</p>
            <p className="text-gray-500 dark:text-slate-500 text-xs font-medium mt-2">
              Sensitive accesses (30d)
            </p>
          </div>
        </Link>
      </div>

      {/* Data Sensitivity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensitivity Overview */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Data Sensitivity Distribution</h3>
          <div className="space-y-4">
            <SensitivityBar label="PHI (Protected Health)" count={metrics.catalog.phiDatasets} total={metrics.catalog.totalDatasets} color="red" />
            <SensitivityBar label="PII (Personal Info)" count={metrics.catalog.piiDatasets} total={metrics.catalog.totalDatasets} color="orange" />
            <SensitivityBar
              label="Other (Internal/Public)"
              count={metrics.catalog.totalDatasets - metrics.catalog.phiDatasets - metrics.catalog.piiDatasets}
              total={metrics.catalog.totalDatasets}
              color="emerald"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Governance Actions</h3>
          <div className="space-y-4">
            <Link
              href="/owner/dashboard/data/quality"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-emerald-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 dark:text-white font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Run Quality Checks</h4>
                <p className="text-gray-500 dark:text-slate-500 text-xs">Execute {metrics.quality.totalRules} validation rules</p>
              </div>
            </Link>

            <Link
              href="/owner/dashboard/data/catalog"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-blue-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Database size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Browse Data Catalog</h4>
                <p className="text-gray-500 dark:text-slate-500 text-xs">Explore {metrics.catalog.totalDatasets} datasets</p>
              </div>
            </Link>

            <Link
              href="/owner/dashboard/data/lineage"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-violet-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <GitBranch size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 dark:text-white font-bold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">View Data Lineage</h4>
                <p className="text-gray-500 dark:text-slate-500 text-xs">Track data flow through {metrics.lineage.totalNodes} nodes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Setup Instructions (if no data) */}
      {metrics.catalog.totalDatasets === 0 && (
        <div className="bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/20 rounded-3xl p-8">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Setup Required</h3>
              <p className="text-gray-700 dark:text-slate-400 mb-4">
                Run the governance setup script to populate the data catalog, quality rules, and lineage graph:
              </p>
              <pre className="bg-gray-100 dark:bg-black/30 rounded-xl p-4 text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                npx tsx scripts/setup-governance.ts
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SensitivityBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: 'red' | 'orange' | 'emerald';
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colors = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="text-sm font-bold text-gray-500 dark:text-slate-400">{count} datasets</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
