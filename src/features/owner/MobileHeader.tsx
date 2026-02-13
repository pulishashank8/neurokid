'use client';

import { Menu, Shield } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-30 safe-area-inset-top">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="p-2.5 -ml-2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>

                <div className="ml-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground font-bold text-lg">NeuroKid</span>
                </div>
            </div>
            <div className="w-10" />
        </div>
    );
}
