"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Music, Bell, Zap, Ghost, Bird, Cat, Dog, Car, CloudRain, Star, Heart, Smile } from "lucide-react";

const SOUNDS = [
    { id: "boing", label: "Boing!", icon: Zap, color: "bg-orange-400", pitch: 1.5, rate: 1.5 },
    { id: "splat", label: "Splat!", icon: CloudRain, color: "bg-blue-400", pitch: 0.5, rate: 1.2 },
    { id: "whoosh", label: "Whoosh", icon: Wind, color: "bg-cyan-400", pitch: 1.2, rate: 2 },
    { id: "ding", label: "Ding!", icon: Bell, color: "bg-yellow-400", pitch: 1.8, rate: 1 },
    { id: "meow", label: "Meow", icon: Cat, color: "bg-purple-400", pitch: 1.5, rate: 1 },
    { id: "woof", label: "Woof", icon: Dog, color: "bg-amber-500", pitch: 0.8, rate: 1 },
    { id: "beep", label: "Beep Bop", icon: Gamepad2, color: "bg-slate-400", pitch: 0.1, rate: 0.8 },
    { id: "laugh", label: "Hahaha", icon: Smile, color: "bg-pink-400", pitch: 1.5, rate: 1.2 },
    { id: "magic", label: "Sparkle", icon: Star, color: "bg-indigo-400", pitch: 2, rate: 1 },
    { id: "ghost", label: "Boo!", icon: Ghost, color: "bg-slate-300", pitch: 0.2, rate: 0.5 },
    { id: "chirp", label: "Chirp", icon: Bird, color: "bg-emerald-400", pitch: 2, rate: 2 },
    { id: "vroom", label: "Vroom", icon: Car, color: "bg-red-400", pitch: 0.5, rate: 0.8 },
];

import { Wind, Gamepad2 } from "lucide-react";

export default function SillySoundsPage() {
    const [playing, setPlaying] = useState<string | null>(null);

    const playSound = (sound: typeof SOUNDS[0]) => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            // Cancel previous
            window.speechSynthesis.cancel();

            const u = new SpeechSynthesisUtterance(sound.label);
            u.pitch = sound.pitch;
            u.rate = sound.rate;
            u.volume = 1;

            u.onend = () => setPlaying(null);
            setPlaying(sound.id);
            window.speechSynthesis.speak(u);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 pt-24 pb-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="mb-4">
                        <BackButton fallbackPath="/games" label="Back to Games" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <Music className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Silly Soundboard</h1>
                            <p className="text-gray-600 dark:text-gray-300">Click the buttons to make funny noises!</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {SOUNDS.map((sound) => (
                        <button
                            key={sound.id}
                            onClick={() => playSound(sound)}
                            className={`aspect-square rounded-3xl ${sound.color} shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-3 p-4 group`}
                        >
                            <div className={`p-4 rounded-full bg-white/20 text-white transition-transform ${playing === sound.id ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`}>
                                <sound.icon className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <span className="font-bold text-white text-lg md:text-xl shadow-black/10 drop-shadow-md">
                                {sound.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

