"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Music } from "lucide-react";
import { motion } from "framer-motion";

const notes = [
    { note: "C", frequency: 261.63, color: "bg-white", label: "C", isBlack: false },
    { note: "C#", frequency: 277.18, color: "bg-black", label: "C#", isBlack: true },
    { note: "D", frequency: 293.66, color: "bg-white", label: "D", isBlack: false },
    { note: "D#", frequency: 311.13, color: "bg-black", label: "D#", isBlack: true },
    { note: "E", frequency: 329.63, color: "bg-white", label: "E", isBlack: false },
    { note: "F", frequency: 349.23, color: "bg-white", label: "F", isBlack: false },
    { note: "F#", frequency: 369.99, color: "bg-black", label: "F#", isBlack: true },
    { note: "G", frequency: 392.00, color: "bg-white", label: "G", isBlack: false },
    { note: "G#", frequency: 415.30, color: "bg-black", label: "G#", isBlack: true },
    { note: "A", frequency: 440.00, color: "bg-white", label: "A", isBlack: false },
    { note: "A#", frequency: 466.16, color: "bg-black", label: "A#", isBlack: true },
    { note: "B", frequency: 493.88, color: "bg-white", label: "B", isBlack: false },
    { note: "C2", frequency: 523.25, color: "bg-white", label: "C", isBlack: false },
];

export default function PianoPage() {
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize Web Audio API
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playNote = (frequency: number, note: string) => {
        if (!audioContextRef.current) return;

        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);

        setActiveNotes(prev => new Set(prev).add(note));
        setTimeout(() => {
            setActiveNotes(prev => {
                const newSet = new Set(prev);
                newSet.delete(note);
                return newSet;
            });
        }, 200);
    };

    const whiteKeys = notes.filter(n => !n.isBlack);
    const blackKeys = notes.filter(n => n.isBlack);

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 p-4 pt-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/games" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-purple-900 dark:text-purple-100">Piano</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-purple-100 dark:border-purple-900">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <Music className="w-8 h-8 text-purple-600" />
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Tap the keys to play beautiful music!
                        </p>
                    </div>

                    {/* Piano Keys */}
                    <div className="relative bg-gradient-to-b from-amber-900 to-amber-950 p-6 rounded-2xl shadow-2xl">
                        <div className="relative flex justify-center">
                            {/* White Keys */}
                            <div className="flex gap-1">
                                {whiteKeys.map((key) => (
                                    <motion.button
                                        key={key.note}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => playNote(key.frequency, key.note)}
                                        className={`relative w-16 h-64 rounded-b-lg shadow-lg border-2 border-gray-300 transition-all ${activeNotes.has(key.note)
                                            ? "bg-gradient-to-b from-purple-200 to-purple-300"
                                            : "bg-gradient-to-b from-white to-gray-100"
                                            } hover:from-purple-50 hover:to-purple-100 active:shadow-inner`}
                                    >
                                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-600">
                                            {key.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Black Keys */}
                            <div className="absolute top-0 left-0 w-full h-40 flex justify-center pointer-events-none">
                                <div className="flex gap-1 relative">
                                    {whiteKeys.map((whiteKey, index) => {
                                        const blackKey = blackKeys.find(bk => {
                                            const whiteIndex = notes.findIndex(n => n.note === whiteKey.note);
                                            const blackIndex = notes.findIndex(n => n.note === bk.note);
                                            return blackIndex === whiteIndex + 1;
                                        });

                                        return (
                                            <div key={whiteKey.note} className="relative w-16">
                                                {blackKey && (
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => playNote(blackKey.frequency, blackKey.note)}
                                                        className={`absolute -right-5 w-10 h-40 rounded-b-lg shadow-xl border-2 border-black transition-all pointer-events-auto z-10 ${activeNotes.has(blackKey.note)
                                                            ? "bg-gradient-to-b from-purple-600 to-purple-800"
                                                            : "bg-gradient-to-b from-gray-800 to-black"
                                                            } hover:from-purple-700 hover:to-purple-900 active:shadow-inner`}
                                                    >
                                                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
                                                            {blackKey.label}
                                                        </span>
                                                    </motion.button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            🎵 Try playing simple songs like "Mary Had a Little Lamb": E-D-C-D-E-E-E
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
