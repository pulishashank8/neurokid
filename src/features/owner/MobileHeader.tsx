'use client';

import { Menu, Shield, Sparkles } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-white/5 flex items-center px-4 z-30">
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-slate-400 hover:text-white"
            >
                <Menu size={24} />
            </button>

            <div className="ml-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">NeuroKid</span>
            </div>
        </div>
    );
}
