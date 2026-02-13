'use client';

import Link from 'next/link';
import {
  UserPlus,
  Mail,
  FileText,
  Download,
  Shield,
  Settings,
  Bell,
  Database,
  BarChart3,
  Users,
  Zap,
} from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface QuickActionsProps {
  className?: string;
}

const actions: QuickAction[] = [
  {
    label: 'View Users',
    href: '/owner/dashboard/users',
    icon: <Users className="w-4 h-4" />,
    color: 'from-blue-500 to-indigo-600',
    description: 'Manage all users',
  },
  {
    label: 'Send Email',
    href: '/owner/dashboard/notifications',
    icon: <Mail className="w-4 h-4" />,
    color: 'from-emerald-500 to-teal-600',
    description: 'Send announcements to users',
  },
  {
    label: 'Moderation',
    href: '/owner/dashboard/moderation',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-amber-500 to-orange-600',
    description: 'Review reports',
  },
  {
    label: 'Export Data',
    href: '/owner/dashboard/data/quality',
    icon: <Download className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-600',
    description: 'Export to Excel/PDF',
  },
  {
    label: 'Analytics',
    href: '/owner/dashboard/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-600',
    description: 'View insights',
  },
  {
    label: 'System',
    href: '/owner/dashboard/system',
    icon: <Settings className="w-4 h-4" />,
    color: 'from-cyan-500 to-blue-600',
    description: 'System health',
  },
];

export default function QuickActions({ className = '' }: QuickActionsProps) {
  return (
    <div className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-4 sm:p-6 min-w-0 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Common tasks at your fingertips</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group relative p-3 sm:p-4 rounded-xl bg-muted/30 border border-border hover:border-border/80 hover:bg-accent/50 transition-all min-h-[80px] sm:min-h-0 flex flex-col justify-center touch-manipulation"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <span className="text-white">{action.icon}</span>
            </div>
            <div className="text-sm font-medium text-white mb-0.5">{action.label}</div>
            {action.description && (
              <div className="text-xs text-muted-foreground">{action.description}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
