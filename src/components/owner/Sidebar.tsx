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
  LogOut
} from 'lucide-react';

const navItems = [
  { href: '/owner/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/owner/dashboard/users', label: 'Users', icon: Users },
  { href: '/owner/dashboard/posts', label: 'Posts', icon: FileText },
  { href: '/owner/dashboard/comments', label: 'Comments', icon: MessageSquare },
  { href: '/owner/dashboard/votes', label: 'Votes/Likes', icon: Heart },
  { href: '/owner/dashboard/activity', label: 'Activity Log', icon: Activity },
];

export default function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 fixed left-0 top-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-400">NeuroKid Owner</h1>
        <p className="text-gray-400 text-sm">Dashboard</p>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <form action="/api/owner/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
