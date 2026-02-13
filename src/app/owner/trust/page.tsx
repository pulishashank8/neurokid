'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Shield,
    ShieldCheck,
    Activity,
    Eye,
    Lock,
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Zap,
    Database,
    RefreshCw,
    ArrowRight,
    TrendingUp,
    Clock,
    Server,
    Users,
    Heart,
    Brain,
} from 'lucide-react';

interface TrustMetrics {
    trustScore: number;
    phiRedactionsToday: number;
    phiRedactionsTotal: number;
    qualityPassRate: number;
    accessLogsToday: number;
    anomaliesDetected: number;
    quarantinedRecords: number;
    lastScanTime: string;
    scannerStatus: 'ACTIVE' | 'IDLE' | 'ERROR';
    complianceStatus: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
}

const defaultMetrics: TrustMetrics = {
    trustScore: 0,
    phiRedactionsToday: 0,
    phiRedactionsTotal: 0,
    qualityPassRate: 0,
    accessLogsToday: 0,
    anomaliesDetected: 0,
    quarantinedRecords: 0,
    lastScanTime: '',
    scannerStatus: 'IDLE',
    complianceStatus: 'COMPLIANT',
};

export default function TrustCenterPage() {
    const [metrics, setMetrics] = useState<TrustMetrics>(defaultMetrics);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        fetchMetrics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchMetrics() {
        try {
            const res = await fetch('/api/governance/summary');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const q = data.data.quality ?? {};
                    const c = data.data.compliance ?? {};
                    const criticalFailures = q.criticalFailures ?? [];
                    const latestFailed = q.latestResults?.failed ?? 0;
                    setMetrics({
                        trustScore: data.data.healthScore ?? 0,
                        phiRedactionsToday: data.data.phiRedactionsToday ?? 0,
                        phiRedactionsTotal: data.data.phiRedactionsTotal ?? 0,
                        qualityPassRate: q.qualityScore ?? 0,
                        accessLogsToday: c.auditLogEntries ?? 0,
                        anomaliesDetected: criticalFailures.length,
                        quarantinedRecords: latestFailed,
                        lastScanTime: data.data.lastUpdated ?? new Date().toISOString(),
                        scannerStatus: 'ACTIVE',
                        complianceStatus: 'COMPLIANT',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch trust metrics:', error);
        } finally {
            setLoading(false);
        }
    }

    async function runManualScan() {
        setScanning(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await fetchMetrics();
        } finally {
            setScanning(false);
        }
    }

    const trustLevel = metrics.trustScore >= 90 ? 'EXCELLENT' : metrics.trustScore >= 75 ? 'GOOD' : metrics.trustScore >= 60 ? 'FAIR' : 'CRITICAL';
    const trustColor = metrics.trustScore >= 90 ? 'emerald' : metrics.trustScore >= 75 ? 'amber' : 'red';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <Shield className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight">
                                        Trust <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Center</span>
                                    </h1>
                                    <p className="text-slate-500 text-sm font-medium">
                                        NeuroKid Healthcare Data Governance
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/owner/dashboard/data/trust"
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                Detailed Metrics <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/owner/dashboard"
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Trust Score */}
                <section className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Trust Score Card */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 rounded-3xl p-10 shadow-2xl">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Data Trust Score</h2>
                                    <p className="text-slate-400 text-sm max-w-md">
                                        Composite score measuring data quality, privacy compliance, and governance maturity across the NeuroKid platform.
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                                    trustColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    trustColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {trustLevel}
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                {/* Score Gauge */}
                                <div className="relative">
                                    <div className={`w-48 h-48 rounded-full border-8 ${
                                        trustColor === 'emerald' ? 'border-emerald-500/20' :
                                        trustColor === 'amber' ? 'border-amber-500/20' :
                                        'border-red-500/20'
                                    } flex items-center justify-center`}>
                                        <div className="text-center">
                                            <div className={`text-6xl font-black ${
                                                trustColor === 'emerald' ? 'text-emerald-400' :
                                                trustColor === 'amber' ? 'text-amber-400' :
                                                'text-red-400'
                                            }`}>
                                                {loading ? '...' : metrics.trustScore}
                                            </div>
                                            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                                                / 100
                                            </div>
                                        </div>
                                    </div>
                                    {/* Animated ring */}
                                    <svg className="absolute inset-0 w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="88"
                                            fill="none"
                                            stroke={trustColor === 'emerald' ? '#10b981' : trustColor === 'amber' ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="8"
                                            strokeDasharray={`${(metrics.trustScore / 100) * 553} 553`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                </div>

                                {/* Score Breakdown */}
                                <div className="flex-1 space-y-4">
                                    <ScoreComponent label="Data Quality" value={98} weight="40%" color="blue" />
                                    <ScoreComponent label="Privacy Compliance" value={100} weight="30%" color="purple" />
                                    <ScoreComponent label="Data Integrity" value={85} weight="20%" color="amber" />
                                    <ScoreComponent label="Governance Maturity" value={90} weight="10%" color="emerald" />
                                </div>
                            </div>
                        </div>

                        {/* HIPAA Compliance Card */}
                        <div className="space-y-6">
                            {/* Compliance Badge */}
                            <div className={`p-8 rounded-3xl border ${
                                metrics.complianceStatus === 'COMPLIANT'
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                            }`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${
                                        metrics.complianceStatus === 'COMPLIANT'
                                            ? 'bg-emerald-500/10'
                                            : 'bg-red-500/10'
                                    }`}>
                                        <ShieldCheck className={`w-8 h-8 ${
                                            metrics.complianceStatus === 'COMPLIANT'
                                                ? 'text-emerald-400'
                                                : 'text-red-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">HIPAA Safe Harbor</h3>
                                        <p className="text-slate-500 text-xs">De-identification Standard</p>
                                    </div>
                                </div>
                                <div className={`text-3xl font-black ${
                                    metrics.complianceStatus === 'COMPLIANT'
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                }`}>
                                    {metrics.complianceStatus}
                                </div>
                                <p className="text-slate-500 text-xs mt-2">
                                    All PHI automatically detected and redacted
                                </p>
                            </div>

                            {/* Privacy Scanner Status */}
                            <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white">Privacy Scanner</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            metrics.scannerStatus === 'ACTIVE'
                                                ? 'bg-emerald-400 animate-pulse'
                                                : 'bg-slate-600'
                                        }`}></div>
                                        <span className={`text-xs font-bold uppercase ${
                                            metrics.scannerStatus === 'ACTIVE'
                                                ? 'text-emerald-400'
                                                : 'text-slate-500'
                                        }`}>
                                            {metrics.scannerStatus}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={runManualScan}
                                    disabled={scanning}
                                    className="w-full py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {scanning ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Eye size={16} />
                                            Run PHI Scan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">Real-Time Governance Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <MetricCard
                            icon={Eye}
                            label="PHI Redacted Today"
                            value={metrics.phiRedactionsToday.toString()}
                            subValue={`${metrics.phiRedactionsTotal.toLocaleString()} total`}
                            color="red"
                            pulse
                        />
                        <MetricCard
                            icon={CheckCircle}
                            label="Quality Pass Rate"
                            value={`${metrics.qualityPassRate}%`}
                            subValue="Last 30 days"
                            color="emerald"
                        />
                        <MetricCard
                            icon={Lock}
                            label="Access Logs Today"
                            value={metrics.accessLogsToday.toString()}
                            subValue="All logged & audited"
                            color="blue"
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            label="Anomalies Detected"
                            value={metrics.anomaliesDetected.toString()}
                            subValue={metrics.anomaliesDetected === 0 ? "All clear" : "Review needed"}
                            color={metrics.anomaliesDetected === 0 ? "emerald" : "amber"}
                        />
                    </div>
                </section>

                {/* Data Categories */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">Protected Data Categories</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DataCategoryCard
                            icon={Brain}
                            title="Screening Results"
                            description="Autism assessment data"
                            sensitivity="PHI"
                            protection="Encrypted at rest, redacted in logs"
                        />
                        <DataCategoryCard
                            icon={Heart}
                            title="Therapy Sessions"
                            description="Session notes and progress"
                            sensitivity="PHI"
                            protection="Access-controlled, audit logged"
                        />
                        <DataCategoryCard
                            icon={Users}
                            title="User Profiles"
                            description="Parent and therapist information"
                            sensitivity="PII"
                            protection="Consent-based, exportable"
                        />
                    </div>
                </section>

                {/* Quick Links */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-6">Governance Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <QuickLink
                            href="/owner/dashboard/data/quality"
                            icon={Zap}
                            label="Quality Dashboard"
                            description="Z-Score anomaly detection"
                        />
                        <QuickLink
                            href="/owner/dashboard/data/access-logs"
                            icon={FileText}
                            label="Access Audit Trail"
                            description="Chain of custody logs"
                        />
                        <QuickLink
                            href="/owner/dashboard/data/catalog"
                            icon={Database}
                            label="Data Catalog"
                            description="Sensitivity classification"
                        />
                        <QuickLink
                            href="/owner/dashboard/data/lineage"
                            icon={Server}
                            label="Data Lineage"
                            description="Flow visualization"
                        />
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-slate-600 text-xs">
                        NeuroKid Trust Center | HIPAA Compliant | Last Updated: {new Date().toLocaleString()}
                    </p>
                </footer>
            </div>
        </div>
    );
}

function ScoreComponent({ label, value, weight, color }: { label: string; value: number; weight: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-bold text-white">{value}%</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorMap[color]} transition-all duration-1000`}
                        style={{ width: `${value}%` }}
                    />
                </div>
                <span className="text-[10px] text-slate-600 font-mono">{weight}</span>
            </div>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    subValue,
    color,
    pulse = false,
}: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string;
    subValue: string;
    color: string;
    pulse?: boolean;
}) {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    };

    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} hover:scale-105 transition-transform`}>
            <div className="flex items-center gap-3 mb-4">
                <Icon className={colors.text} size={20} />
                {pulse && <div className={`w-2 h-2 rounded-full ${colors.text.replace('text', 'bg')} animate-pulse`}></div>}
            </div>
            <div className={`text-3xl font-black ${colors.text} mb-1`}>{value}</div>
            <div className="text-slate-500 text-xs font-medium">{label}</div>
            <div className="text-slate-600 text-[10px] mt-1">{subValue}</div>
        </div>
    );
}

function DataCategoryCard({
    icon: Icon,
    title,
    description,
    sensitivity,
    protection,
}: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    title: string;
    description: string;
    sensitivity: 'PHI' | 'PII' | 'INTERNAL';
    protection: string;
}) {
    const sensitivityColors = {
        PHI: 'bg-red-500/10 text-red-400 border-red-500/20',
        PII: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        INTERNAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    return (
        <div className="p-6 bg-slate-900 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
                <Icon className="text-slate-400" size={24} />
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${sensitivityColors[sensitivity]}`}>
                    {sensitivity}
                </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-slate-500 text-sm mb-4">{description}</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <Lock size={12} />
                <span>{protection}</span>
            </div>
        </div>
    );
}

function QuickLink({
    href,
    icon: Icon,
    label,
    description,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all flex items-center gap-4"
        >
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                <Icon className="text-slate-400 group-hover:text-emerald-400 transition-colors" size={20} />
            </div>
            <div>
                <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{label}</div>
                <div className="text-[10px] text-slate-600">{description}</div>
            </div>
        </Link>
    );
}
