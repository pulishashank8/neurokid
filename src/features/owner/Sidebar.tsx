'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Heart,
  Activity,
  LogOut,
  BarChart3,
  ClipboardList,
  Building2,
  Search,
  Wifi,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Share2
} from 'lucide-react';

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
  // Data Governance
  { href: '/owner/dashboard/data', label: 'Data Governance', icon: Shield, color: 'teal' },
  { href: '/owner/dashboard/data/catalog', label: 'Data Catalog', icon: Database, color: 'blue' },
  { href: '/owner/dashboard/data/quality', label: 'Quality & ML', icon: Activity, color: 'indigo' },
  { href: '/owner/dashboard/data/lineage', label: 'Data Lineage', icon: Share2, color: 'violet' },
  { href: '/owner/dashboard/data/stewardship', label: 'Stewardship', icon: Users, color: 'cyan' },
  { href: '/owner/dashboard/data/trust', label: 'Trust Center', icon: Heart, color: 'rose' },
  { href: '/owner/dashboard/data/access-logs', label: 'Audit Logs', icon: FileText, color: 'amber' },
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

interface SidebarProps {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

export default function OwnerSidebar({ isCollapsed = false, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-slate-900/80 backdrop-blur-xl border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'
        }`}
    >
      {/* Header */}
      <div className={`mb-4 pt-6 px-6 relative flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className={`min-w-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            <h1 className="text-lg font-bold text-white truncate">NeuroKid</h1>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-400 truncate">Owner Dashboard</span>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className={`absolute top-8 p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-slate-700 shadow-xl ${isCollapsed ? '-right-3' : 'right-4'
              }`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 pb-24 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));
          const colors = colorMap[item.color] || colorMap.emerald;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all duration-200 ${isActive
                ? `${colors.activeBg} text-white shadow-lg`
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isActive
                ? 'bg-white/20'
                : `${colors.bg} group-hover:scale-110`
                }`}>
                <item.icon size={16} className={isActive ? 'text-white' : colors.text} />
              </div>
              <span className={`text-sm font-medium truncate transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 pt-4 border-t border-white/5 bg-slate-900/95 backdrop-blur-xl ${isCollapsed ? 'px-2' : ''}`}>
        <form action="/api/owner/logout" method="POST">
          <button
            type="submit"
            className={`flex items-center ${isCollapsed ? 'justify-center p-0' : 'gap-3 px-4'} py-3 w-full text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all group`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all flex-shrink-0">
              <LogOut size={16} className="text-red-400" />
            </div>
            <span className={`text-sm font-medium transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
