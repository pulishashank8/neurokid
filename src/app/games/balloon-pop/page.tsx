"use client";

import { useState, useEffect, useCallback } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { PartyPopper } from "lucide-react";

interface Balloon {
    id: number;
    color: string;
    left: number;
    speed: number;
}

const COLORS = [
    "bg-red-500 shadow-red-500/50",
    "bg-blue-500 shadow-blue-500/50",
    "bg-green-500 shadow-green-500/50",
    "bg-yellow-400 shadow-yellow-400/50",
    "bg-purple-500 shadow-purple-500/50",
    "bg-pink-500 shadow-pink-500/50"
];

export default function BalloonPopPage() {
    const [balloons, setBalloons] = useState<Balloon[]>([]);
    const [score, setScore] = useState(0);

    const spawnBalloon = useCallback(() => {
        const id = Date.now();
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const left = Math.floor(Math.random() * 85) + 5; // 5% to 90%
        const speed = Math.random() * 3 + 4; // 4-7 seconds

        setBalloons(prev => {
            // limit total balloons to avoid lag
            if (prev.length > 15) return prev;
            return [...prev, { id, color, left, speed }];
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(spawnBalloon, 800);
        return () => clearInterval(interval);
    }, [spawnBalloon]);

    // Cleanup old balloons
    useEffect(() => {
        const cleanup = setInterval(() => {
            setBalloons(prev => prev.filter(b => b.id > Date.now() - 10000));
        }, 2000);
        return () => clearInterval(cleanup);
    }, []);

    const popBalloon = (id: number) => {
        // Pop sound
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance("Pop");
            u.rate = 2.5;
            u.volume = 0.3;
            window.speechSynthesis.speak(u);
        }

        setScore(s => s + 1);
        setBalloons(prev => prev.filter(b => b.id !== id));
    };

    return (
        <div className="min-h-screen bg-sky-100 dark:bg-sky-950 overflow-hidden relative pt-24">
            {/* Inject CSS animation */}
            <style jsx>{`
         @keyframes floatUp {
           from { transform: translateY(110vh) rotate(0deg); }
           to { transform: translateY(-20vh) rotate(10deg); }
         }
         .balloon-float {
           animation-name: floatUp;
           animation-timing-function: linear;
           animation-fill-mode: forwards;
         }
       `}</style>

            <div className="absolute top-24 left-0 w-full z-20 px-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <BackButton fallbackPath="/games" />
                    <div className="bg-white/80 dark:bg-black/50 px-6 py-3 rounded-full font-bold text-2xl backdrop-blur-sm shadow-xl flex items-center gap-3 border-2 border-white/50">
                        <PartyPopper className="text-pink-500 w-6 h-6" />
                        <span className="text-gray-800 dark:text-white">Popped: {score}</span>
                    </div>
                </div>
            </div>

            {/* Balloons */}
            <div className="absolute inset-0 z-10">
                {balloons.map(b => (
                    <div
                        key={b.id}
                        className="absolute top-0 balloon-float cursor-pointer hover:scale-110 active:scale-90 transition-transform touch-none"
                        style={{
                            left: `${b.left}%`,
                            animationDuration: `${b.speed}s`,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            popBalloon(b.id);
                        }}
                    >
                        <div className={`w-24 h-32 ${b.color} rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] opacity-90 relative flex items-center justify-center shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.1)]`}>
                            {/* Highlight */}
                            <div className="w-4 h-8 bg-white/40 rounded-full absolute top-4 left-4 -rotate-45" />
                            {/* String */}
                            <div className="w-0.5 h-16 bg-white/50 absolute top-full left-1/2 -translate-x-1/2 origin-top animate-pulse" />
                            {/* Tie */}
                            <div className={`w-3 h-3 ${b.color} absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 rounded-sm`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

