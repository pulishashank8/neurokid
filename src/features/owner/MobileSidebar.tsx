'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield, Sparkles, LayoutDashboard, BarChart3, Users, FileText, MessageSquare, Heart, Activity, Wifi, ClipboardList, Building2, Search, LogOut, Database, Share2 } from 'lucide-react';

const navItems = [
    { href: '/owner/dashboard', label: 'Overview', icon: LayoutDashboard, color: 'emerald' },
    { href: '/owner/dashboard/analytics', label: 'Analytics', icon: BarChart3, color: 'blue' },
    { href: '/owner/dashboard/users', label: 'Users', icon: Users, color: 'violet' },
    { href: '/owner/dashboard/posts', label: 'Posts', icon: FileText, color: 'orange' },
    { href: '/owner/dashboard/comments', label: 'Comments', icon: MessageSquare, color: 'cyan' },
    { href: '/owner/dashboard/votes', label: 'Votes/Likes', icon: Heart, color: 'rose' },
    { href: '/owner/dashboard/activity', label: 'Activity Log', icon: Activity, color: 'amber' },
    { href: '/owner/dashboard/online', label: 'Online Users', icon: Wifi, color: 'green' },
    { href: '/owner/dashboard/screening', label: 'Screenings', icon: ClipboardList, color: 'purple' },
    { href: '/owner/dashboard/data/trust', label: 'Trust Center', icon: Shield, color: 'emerald' },
    { href: '/owner/dashboard/data/catalog', label: 'Data Catalog', icon: Database, color: 'blue' },
    { href: '/owner/dashboard/data/quality', label: 'Quality & ML', icon: Activity, color: 'indigo' },
    { href: '/owner/dashboard/data/lineage', label: 'Data Lineage', icon: Share2, color: 'violet' },
    { href: '/owner/dashboard/data/access-logs', label: 'Audit Logs', icon: FileText, color: 'rose' },
];

const colorMap: Record<string, { bg: string; text: string; activeBg: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', activeBg: 'bg-gradient-to-r from-violet-600 to-purple-600' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', activeBg: 'bg-gradient-to-r from-orange-600 to-red-600' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', activeBg: 'bg-gradient-to-r from-rose-600 to-pink-600' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', activeBg: 'bg-gradient-to-r from-green-600 to-emerald-600' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', activeBg: 'bg-gradient-to-r from-purple-600 to-violet-600' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', activeBg: 'bg-gradient-to-r from-indigo-600 to-blue-600' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', activeBg: 'bg-gradient-to-r from-teal-600 to-cyan-600' },
};

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-white truncate">NeuroKid</h1>
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-emerald-400 truncate">Owner</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));
                        const colors = colorMap[item.color] || colorMap.emerald;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                    ? `${colors.activeBg} text-white shadow-lg`
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isActive
                                    ? 'bg-white/20'
                                    : `${colors.bg} group-hover:scale-110`
                                    }`}>
                                    <item.icon size={16} className={isActive ? 'text-white' : colors.text} />
                                </div>
                                <span className="text-sm font-medium truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/5 mt-auto">
                    <form action="/api/owner/logout" method="POST">
                        <button
                            type="submit"
                            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                                <LogOut size={16} className="text-red-400" />
                            </div>
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
