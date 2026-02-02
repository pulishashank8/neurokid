'use client';

import { useState } from 'react';
import OwnerSidebar from '@/features/owner/Sidebar';
import MobileSidebar from '@/features/owner/MobileSidebar';
import MobileHeader from '@/features/owner/MobileHeader';
import SessionTimer from '@/features/owner/SessionTimer';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]"></div>
            </div>

            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />

            {/* Desktop Sidebar (Controlled) */}
            <div className="hidden lg:block">
                <OwnerSidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar (Controlled) */}
            <div className="lg:hidden">
                <MobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setMobileSidebarOpen(false)}
                />
            </div>

            {/* Main Content (Dynamic Margin) */}
            <main
                className={`flex-1 p-4 lg:p-8 relative z-10 pt-20 lg:pt-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
                    }`}
            >
                <SessionTimer />
                {children}
            </main>
        </div>
    );
}
