"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Music2 } from "lucide-react";
import { motion } from "framer-motion";

const strings = [
    { name: "E", frequency: 82.41, color: "from-yellow-600 to-yellow-700", label: "E (Low)" },
    { name: "A", frequency: 110.00, color: "from-orange-600 to-orange-700", label: "A" },
    { name: "D", frequency: 146.83, color: "from-red-600 to-red-700", label: "D" },
    { name: "G", frequency: 196.00, color: "from-blue-600 to-blue-700", label: "G" },
    { name: "B", frequency: 246.94, color: "from-green-600 to-green-700", label: "B" },
    { name: "E2", frequency: 329.63, color: "from-purple-600 to-purple-700", label: "E (High)" },
];

const chords = [
    { name: "C Major", notes: [261.63, 329.63, 392.00], color: "bg-blue-500" },
    { name: "G Major", notes: [196.00, 246.94, 392.00], color: "bg-green-500" },
    { name: "D Major", notes: [146.83, 220.00, 293.66], color: "bg-yellow-500" },
    { name: "A Minor", notes: [220.00, 261.63, 329.63], color: "bg-purple-500" },
];

export default function GuitarPage() {
    const [activeStrings, setActiveStrings] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<"strings" | "chords">("strings");
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playSound = (frequency: number, duration: number = 1.5) => {
        if (!audioContextRef.current) return;

        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "triangle"; // Guitar-like sound

        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
    };

    const strumString = (stringName: string, frequency: number) => {
        playSound(frequency);

        setActiveStrings(prev => new Set(prev).add(stringName));
        setTimeout(() => {
            setActiveStrings(prev => {
                const newSet = new Set(prev);
                newSet.delete(stringName);
                return newSet;
            });
        }, 300);
    };

    const playChord = (notes: number[], chordName: string) => {
        notes.forEach((freq, index) => {
            setTimeout(() => playSound(freq, 2), index * 50);
        });

        setActiveStrings(new Set(strings.map(s => s.name)));
        setTimeout(() => {
            setActiveStrings(new Set());
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 p-4 pt-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/games" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Guitar</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-amber-100 dark:border-amber-900">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <Music2 className="w-8 h-8 text-amber-600" />
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Strum the strings or play chords!
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-8 justify-center">
                        <button
                            onClick={() => setMode("strings")}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${mode === "strings"
                                ? "bg-amber-600 text-white shadow-lg"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                        >
                            Single Strings
                        </button>
                        <button
                            onClick={() => setMode("chords")}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${mode === "chords"
                                ? "bg-amber-600 text-white shadow-lg"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                        >
                            Chords
                        </button>
                    </div>

                    {mode === "strings" ? (
                        /* Guitar Strings */
                        <div className="relative bg-gradient-to-r from-amber-800 to-amber-900 p-8 rounded-2xl shadow-2xl">
                            {/* Guitar Body Decoration */}
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-amber-950/30 border-4 border-amber-950/50" />

                            <div className="relative space-y-6">
                                {strings.map((string, index) => (
                                    <motion.div
                                        key={string.name}
                                        className="relative"
                                        animate={{
                                            y: activeStrings.has(string.name) ? [-2, 2, -2, 0] : 0,
                                        }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <button
                                            onClick={() => strumString(string.name, string.frequency)}
                                            className="w-full relative group"
                                        >
                                            {/* String Label */}
                                            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-200">
                                                {string.label}
                                            </div>

                                            {/* String */}
                                            <div
                                                className={`h-1 rounded-full bg-gradient-to-r ${string.color} shadow-lg transition-all group-hover:h-1.5 ${activeStrings.has(string.name) ? "h-2 shadow-2xl" : ""
                                                    }`}
                                                style={{
                                                    height: `${2 + index * 0.5}px`,
                                                }}
                                            />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Chord Buttons */
                        <div className="grid grid-cols-2 gap-4">
                            {chords.map((chord) => (
                                <motion.button
                                    key={chord.name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => playChord(chord.notes, chord.name)}
                                    className={`${chord.color} text-white p-8 rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl transition-all`}
                                >
                                    {chord.name}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            🎸 {mode === "strings" ? "Tap each string to hear its sound!" : "Tap chord buttons to play beautiful harmonies!"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
