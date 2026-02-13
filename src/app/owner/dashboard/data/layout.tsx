'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, GitBranch, Activity, Workflow, Shield, Users, Eye, Heart } from 'lucide-react';

const dataNavItems = [
    { href: '/owner/dashboard/data/catalog', label: 'Catalog', icon: Database },
    { href: '/owner/dashboard/data/lineage', label: 'Lineage', icon: GitBranch },
    { href: '/owner/dashboard/data/quality', label: 'Quality & ML', icon: Activity },
    { href: '/owner/dashboard/data/pipelines', label: 'Pipelines', icon: Workflow },
    { href: '/owner/dashboard/data/stewardship', label: 'Stewardship', icon: Users },
    { href: '/owner/dashboard/data/trust', label: 'Trust Center', icon: Heart },
    { href: '/owner/dashboard/data/access-logs', label: 'Audit Logs', icon: Eye },
    { href: '/owner/dashboard/data/hipaa', label: 'HIPAA', icon: Shield },
    { href: '/owner/dashboard/data/governance', label: 'Privacy', icon: Shield },
];

export default function DataOpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            {/* Internal Navigation for Data Ops */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto">
                {dataNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon size={14} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            <div className="min-h-[600px] relative">
                {children}
            </div>
        </div>
    );
}
