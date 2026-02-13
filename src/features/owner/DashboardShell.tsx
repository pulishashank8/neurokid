'use client';

import { useState } from 'react';
import OwnerSidebar from '@/features/owner/Sidebar';
import MobileSidebar from '@/features/owner/MobileSidebar';
import MobileHeader from '@/features/owner/MobileHeader';
import SessionTimer from '@/features/owner/SessionTimer';
import AlertBanner from '@/features/owner/AlertBanner';
import NotificationCenter from '@/features/owner/NotificationCenter';
import ThemeToggle from '@/features/owner/ThemeToggle';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen min-w-0 bg-gradient-to-br from-background via-surface2 to-background overflow-x-hidden transition-colors duration-500 ease-out" data-owner-dashboard>
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]"></div>
            </div>

            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />

            {/* Desktop Sidebar (Controlled) - md+ tablets and up */}
            <div className="hidden md:block">
                <OwnerSidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar (Controlled) - phones only */}
            <div className="md:hidden">
                <MobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setMobileSidebarOpen(false)}
                />
            </div>

            {/* Main Content (Dynamic Margin) - min-w-0 prevents overflow */}
            <main
                className={`flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 relative z-10 pt-28 md:pt-20 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
                    }`}
            >
                {/* Unified header bar: ThemeToggle | Notifications | SessionTimer - constrained so it doesn't overlap content */}
                <div className="fixed top-16 right-4 left-auto md:top-4 md:right-6 z-50 flex items-center justify-end gap-2 sm:gap-3 shrink-0">
                    <ThemeToggle />
                    <NotificationCenter />
                    <SessionTimer />
                </div>
                <AlertBanner />
                {children}
            </main>
        </div>
    );
}
