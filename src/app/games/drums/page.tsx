"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Music4 } from "lucide-react";
import { motion } from "framer-motion";

const drums = [
    { id: "kick", name: "Bass Drum", frequency: 60, color: "from-red-500 to-red-700", position: "col-span-2", emoji: "🥁" },
    { id: "snare", name: "Snare", frequency: 200, color: "from-blue-500 to-blue-700", position: "", emoji: "🎵" },
    { id: "hihat", name: "Hi-Hat", frequency: 800, color: "from-yellow-500 to-yellow-700", position: "", emoji: "⚡" },
    { id: "tom1", name: "Tom 1", frequency: 150, color: "from-green-500 to-green-700", position: "", emoji: "🎶" },
    { id: "tom2", name: "Tom 2", frequency: 120, color: "from-purple-500 to-purple-700", position: "", emoji: "🎼" },
    { id: "crash", name: "Crash", frequency: 1000, color: "from-orange-500 to-orange-700", position: "col-span-2", emoji: "💥" },
];

export default function DrumsPage() {
    const [activeDrums, setActiveDrums] = useState<Set<string>>(new Set());
    const [combo, setCombo] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playDrum = (id: string, frequency: number) => {
        if (!audioContextRef.current) return;

        const context = audioContextRef.current;

        // Create different sounds for different drums
        if (id === "kick") {
            // Bass drum - low frequency with quick decay
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.frequency.setValueAtTime(150, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, context.currentTime + 0.1);

            gainNode.gain.setValueAtTime(1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
        } else if (id === "snare" || id === "hihat" || id === "crash") {
            // Snare/Hi-hat/Crash - noise-based
            const bufferSize = context.sampleRate * 0.3;
            const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // eslint-disable-next-line react-hooks/purity -- noise buffer; runs only in playDrum (event handler)
                data[i] = Math.random() * 2 - 1;
            }

            const noise = context.createBufferSource();
            noise.buffer = buffer;

            const filter = context.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = id === "hihat" ? 7000 : id === "crash" ? 5000 : 3000;

            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(id === "hihat" ? 0.3 : 0.5, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + (id === "crash" ? 1 : 0.2));

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(context.destination);

            noise.start(context.currentTime);
            noise.stop(context.currentTime + (id === "crash" ? 1 : 0.3));
        } else {
            // Toms - pitched drums
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = "sine";

            gainNode.gain.setValueAtTime(0.5, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);

            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.4);
        }

        setActiveDrums(prev => new Set(prev).add(id));
        setCombo(prev => prev + 1);

        setTimeout(() => {
            setActiveDrums(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }, 200);
    };

    const playPattern = () => {
        const pattern = [
            { drum: "kick", delay: 0 },
            { drum: "hihat", delay: 200 },
            { drum: "snare", delay: 400 },
            { drum: "hihat", delay: 600 },
            { drum: "kick", delay: 800 },
            { drum: "crash", delay: 1000 },
        ];

        pattern.forEach(({ drum, delay }) => {
            setTimeout(() => {
                const drumData = drums.find(d => d.id === drum);
                if (drumData) {
                    playDrum(drumData.id, drumData.frequency);
                }
            }, delay);
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-4 pt-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/games" className="p-2 bg-slate-700 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-orange-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Drum Kit</h1>
                </div>

                <div className="bg-slate-700/50 backdrop-blur rounded-3xl p-8 shadow-xl border border-orange-500/30">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Music4 className="w-8 h-8 text-orange-400" />
                            <p className="text-lg font-semibold text-white">
                                Tap the drums to play!
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Combo</div>
                            <div className="text-3xl font-bold text-orange-400">{combo}</div>
                        </div>
                    </div>

                    {/* Drum Kit */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {drums.map((drum) => (
                            <motion.button
                                key={drum.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => playDrum(drum.id, drum.frequency)}
                                className={`${drum.position} relative overflow-hidden rounded-2xl bg-gradient-to-br ${drum.color} p-8 shadow-2xl transition-all ${activeDrums.has(drum.id) ? "ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.5)]" : ""
                                    }`}
                            >
                                <div className="text-6xl mb-2">{drum.emoji}</div>
                                <div className="text-white font-bold text-sm">{drum.name}</div>

                                {/* Hit effect */}
                                {activeDrums.has(drum.id) && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        className="absolute inset-0 bg-white rounded-2xl"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Play Pattern Button */}
                    <button
                        onClick={playPattern}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                        <Music4 className="w-5 h-5" />
                        Play Demo Pattern
                    </button>

                    <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-600">
                        <p className="text-sm text-center text-gray-300">
                            🥁 Create your own beats! Try tapping different drums in rhythm!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
