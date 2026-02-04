"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, Settings, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Emotion = "happy" | "sad" | "angry" | "tired" | "calm";
type MiniGame = "none" | "colorPop" | "soundExplorer" | "emotionMatch" | "rhythmTap" | "music";

const emotions = [
    { id: "happy" as Emotion, emoji: "😊", label: "Happy", color: "bg-yellow-100" },
    { id: "sad" as Emotion, emoji: "😢", label: "Sad", color: "bg-blue-100" },
    { id: "angry" as Emotion, emoji: "😡", label: "Angry", color: "bg-red-100" },
    { id: "tired" as Emotion, emoji: "😴", label: "Tired", color: "bg-purple-100" },
];

const emotionMessages = {
    happy: "I'm so glad you're feeling happy! Let's celebrate together! 🌟",
    sad: "It's okay to feel sad sometimes. Would you like to take a calm breath with me?",
    angry: "I understand you feel angry. Let's breathe slowly together and feel calmer.",
    tired: "You sound tired. That's okay! Let's rest together for a moment.",
    calm: "You're doing great! I'm here with you.",
};

export default function CalmBuddyPage() {
    const [currentEmotion, setCurrentEmotion] = useState<Emotion>("calm");
    const [stars, setStars] = useState(0);
    const [message, setMessage] = useState("Hi! I'm Calm Buddy. I'm here to play and talk with you! 💙");
    const [isBreathing, setIsBreathing] = useState(false);
    const [currentGame, setCurrentGame] = useState<MiniGame>("none");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Breathing animation for calming
    useEffect(() => {
        if (currentEmotion === "sad" || currentEmotion === "angry") {
            setIsBreathing(true);
        } else {
            setIsBreathing(false);
        }
    }, [currentEmotion]);

    const speak = (text: string) => {
        if (!soundEnabled) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8; // Slow and calm
            utterance.pitch = 1.1; // Slightly higher, friendly
            utterance.volume = 0.7; // Not too loud
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleEmotionClick = (emotion: Emotion) => {
        setCurrentEmotion(emotion);
        setMessage(emotionMessages[emotion]);
        speak(emotionMessages[emotion]);
        setStars(prev => prev + 1);
    };

    const playMiniGame = (game: MiniGame) => {
        setCurrentGame(game);
        setStars(prev => prev + 1);
    };

    if (currentGame !== "none") {
        return <MiniGameScreen game={currentGame} onBack={() => setCurrentGame("none")} soundEnabled={soundEnabled} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 p-4 pt-20">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Link
                        href="/games"
                        className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full shadow-lg hover:scale-110 transition-all"
                    >
                        <ArrowLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </Link>

                    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full shadow-lg">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-purple-900 dark:text-purple-100">{stars}</span>
                    </div>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full shadow-lg hover:scale-110 transition-all"
                    >
                        <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </button>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-4 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl"
                        >
                            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-3">Settings</h3>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="flex items-center gap-3 w-full p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Character */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl border-4 border-purple-200 dark:border-purple-800 mb-6">
                    {/* Calm Buddy Character */}
                    <div className="relative mb-6">
                        <motion.div
                            animate={{
                                scale: isBreathing ? [1, 1.05, 1] : 1,
                            }}
                            transition={{
                                duration: 4,
                                repeat: isBreathing ? Infinity : 0,
                                ease: "easeInOut",
                            }}
                            className="w-48 h-48 mx-auto relative"
                        >
                            {/* Body */}
                            <div className={`w-full h-full rounded-full transition-colors duration-1000 ${currentEmotion === "happy" ? "bg-gradient-to-br from-yellow-200 to-yellow-300" :
                                currentEmotion === "sad" ? "bg-gradient-to-br from-blue-200 to-blue-300" :
                                    currentEmotion === "angry" ? "bg-gradient-to-br from-red-200 to-red-300" :
                                        currentEmotion === "tired" ? "bg-gradient-to-br from-purple-200 to-purple-300" :
                                            "bg-gradient-to-br from-sky-200 to-purple-200"
                                } shadow-2xl flex items-center justify-center`}>

                                {/* Face */}
                                <div className="relative">
                                    {/* Eyes */}
                                    <div className="flex gap-8 mb-6">
                                        <motion.div
                                            animate={{
                                                scaleY: [1, 0.1, 1],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                repeatDelay: 2,
                                            }}
                                            className="w-6 h-6 bg-slate-800 dark:bg-slate-900 rounded-full"
                                        />
                                        <motion.div
                                            animate={{
                                                scaleY: [1, 0.1, 1],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                repeatDelay: 2,
                                            }}
                                            className="w-6 h-6 bg-slate-800 dark:bg-slate-900 rounded-full"
                                        />
                                    </div>

                                    {/* Mouth */}
                                    <div className="flex justify-center">
                                        {currentEmotion === "happy" && (
                                            <div className="w-16 h-8 border-4 border-slate-800 dark:border-slate-900 rounded-b-full" />
                                        )}
                                        {currentEmotion === "sad" && (
                                            <div className="w-16 h-8 border-4 border-slate-800 dark:border-slate-900 rounded-t-full" />
                                        )}
                                        {currentEmotion === "angry" && (
                                            <div className="w-16 h-2 bg-slate-800 dark:bg-slate-900 rounded" />
                                        )}
                                        {currentEmotion === "tired" && (
                                            <div className="w-12 h-3 bg-slate-800 dark:bg-slate-900 rounded-full" />
                                        )}
                                        {currentEmotion === "calm" && (
                                            <div className="w-14 h-6 border-4 border-slate-800 dark:border-slate-900 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Breathing Guide */}
                            {isBreathing && (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute inset-0 border-4 border-blue-400 rounded-full"
                                />
                            )}
                        </motion.div>

                        {/* Character Name */}
                        <h2 className="text-center text-2xl font-bold text-purple-900 dark:text-purple-100 mt-4">
                            Calm Buddy
                        </h2>
                    </div>

                    {/* Message Bubble */}
                    <motion.div
                        key={message}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-2xl mb-6 text-center"
                    >
                        <p className="text-purple-900 dark:text-purple-100 text-lg">{message}</p>
                    </motion.div>

                    {/* Emotion Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {emotions.map((emotion) => (
                            <motion.button
                                key={emotion.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEmotionClick(emotion.id)}
                                className={`${emotion.color} dark:bg-opacity-20 p-4 rounded-2xl shadow-lg border-2 ${currentEmotion === emotion.id ? "border-purple-500 ring-4 ring-purple-200" : "border-transparent"
                                    } transition-all`}
                            >
                                <div className="text-4xl mb-2">{emotion.emoji}</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{emotion.label}</div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Mini Games */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-purple-900 dark:text-purple-100 text-center mb-3">
                            Gentle Activities
                        </h3>

                        <button
                            onClick={() => playMiniGame("colorPop")}
                            className="w-full p-4 bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="font-bold text-purple-900 dark:text-purple-100">🫧 Color Bubbles</span>
                        </button>

                        <button
                            onClick={() => playMiniGame("soundExplorer")}
                            className="w-full p-4 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="font-bold text-purple-900 dark:text-purple-100">🔔 Sound Explorer</span>
                        </button>

                        <button
                            onClick={() => playMiniGame("emotionMatch")}
                            className="w-full p-4 bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="font-bold text-purple-900 dark:text-purple-100">😊 Emotion Match</span>
                        </button>

                        <button
                            onClick={() => playMiniGame("rhythmTap")}
                            className="w-full p-4 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="font-bold text-purple-900 dark:text-purple-100">⭕ Rhythm Tap</span>
                        </button>

                        <button
                            onClick={() => playMiniGame("music")}
                            className="w-full p-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="font-bold text-purple-900 dark:text-purple-100">🎵 Gentle Music</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mini Game Screen Component
function MiniGameScreen({ game, onBack, soundEnabled }: { game: MiniGame; onBack: () => void; soundEnabled: boolean }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 p-4 pt-20">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={onBack}
                    className="mb-4 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full shadow-lg hover:scale-110 transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </button>

                {game === "colorPop" && <ColorPopGame soundEnabled={soundEnabled} />}
                {game === "soundExplorer" && <SoundExplorerGame soundEnabled={soundEnabled} />}
                {game === "emotionMatch" && <EmotionMatchGame soundEnabled={soundEnabled} />}
                {game === "rhythmTap" && <RhythmTapGame soundEnabled={soundEnabled} />}
                {game === "music" && <GentleMusicGame soundEnabled={soundEnabled} />}
            </div>
        </div>
    );
}

// Color Pop Game
function ColorPopGame({ soundEnabled }: { soundEnabled: boolean }) {
    const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBubbles(prev => [...prev, {
                id: idRef.current++,
                x: Math.random() * 80 + 10,
                y: 100,
                color: ["bg-pink-300", "bg-purple-300", "bg-blue-300", "bg-yellow-300", "bg-green-300"][Math.floor(Math.random() * 5)],
            }]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const popBubble = (id: number) => {
        if (soundEnabled) {
            const audio = new Audio();
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.3);
        }
        setBubbles(prev => prev.filter(b => b.id !== id));
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl min-h-[600px] relative overflow-hidden">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center mb-4">
                Color Bubbles 🫧
            </h2>
            <p className="text-center text-purple-700 dark:text-purple-300 mb-6">
                Tap the bubbles gently!
            </p>

            {bubbles.map(bubble => (
                <motion.button
                    key={bubble.id}
                    initial={{ y: "100vh", scale: 0 }}
                    animate={{ y: "-100vh", scale: 1 }}
                    transition={{ duration: 8, ease: "linear" }}
                    onClick={() => popBubble(bubble.id)}
                    className={`absolute w-20 h-20 ${bubble.color} rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity`}
                    style={{ left: `${bubble.x}%` }}
                />
            ))}
        </div>
    );
}

// Sound Explorer Game
function SoundExplorerGame({ soundEnabled }: { soundEnabled: boolean }) {
    const sounds = [
        { id: "bell", emoji: "🔔", name: "Bell", freq: 800 },
        { id: "rain", emoji: "🌧️", name: "Rain", freq: 400 },
        { id: "chime", emoji: "🎐", name: "Chime", freq: 600 },
        { id: "bird", emoji: "🐦", name: "Bird", freq: 1000 },
    ];

    const playSound = (freq: number) => {
        if (!soundEnabled) return;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
        oscillator.start();
        oscillator.stop(context.currentTime + 1);
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center mb-4">
                Sound Explorer 🔔
            </h2>
            <p className="text-center text-purple-700 dark:text-purple-300 mb-6">
                Tap to hear gentle sounds!
            </p>

            <div className="grid grid-cols-2 gap-4">
                {sounds.map(sound => (
                    <motion.button
                        key={sound.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playSound(sound.freq)}
                        className="p-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl shadow-lg"
                    >
                        <div className="text-6xl mb-2">{sound.emoji}</div>
                        <div className="font-bold text-purple-900 dark:text-purple-100">{sound.name}</div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// Emotion Match Game
function EmotionMatchGame({ soundEnabled }: { soundEnabled: boolean }) {
    const [score, setScore] = useState(0);
    const [currentEmotion, setCurrentEmotion] = useState({ emoji: "😊", name: "Happy" });

    const emotions = [
        { emoji: "😊", name: "Happy" },
        { emoji: "😢", name: "Sad" },
        { emoji: "😡", name: "Angry" },
        { emoji: "😴", name: "Tired" },
    ];

    const checkMatch = (selected: string) => {
        if (selected === currentEmotion.name) {
            setScore(prev => prev + 1);
            setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center mb-4">
                Emotion Match 😊
            </h2>
            <div className="text-center mb-6">
                <div className="text-8xl mb-4">{currentEmotion.emoji}</div>
                <p className="text-purple-700 dark:text-purple-300">Which feeling is this?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {emotions.map(emotion => (
                    <button
                        key={emotion.name}
                        onClick={() => checkMatch(emotion.name)}
                        className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        <span className="font-bold text-purple-900 dark:text-purple-100">{emotion.name}</span>
                    </button>
                ))}
            </div>

            <div className="mt-6 text-center">
                <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">Score: {score}</span>
            </div>
        </div>
    );
}

// Rhythm Tap Game
function RhythmTapGame({ soundEnabled }: { soundEnabled: boolean }) {
    const [circles, setCircles] = useState<Array<{ id: number; delay: number }>>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCircles(prev => [...prev, { id: idRef.current++, delay: 0 }]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const tapCircle = (id: number) => {
        if (soundEnabled) {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.2, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.5);
        }
        setCircles(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl min-h-[600px] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center mb-4">
                Rhythm Tap ⭕
            </h2>
            <p className="text-center text-purple-700 dark:text-purple-300 mb-6">
                Tap the glowing circles!
            </p>

            <div className="relative w-full h-96">
                {circles.map(circle => (
                    <motion.button
                        key={circle.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                        transition={{ duration: 2 }}
                        onClick={() => tapCircle(circle.id)}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-2xl"
                        style={{
                            boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Gentle Music Game
function GentleMusicGame({ soundEnabled }: { soundEnabled: boolean }) {
    const notes = [
        { note: "C", freq: 261.63, color: "from-red-200 to-red-300" },
        { note: "D", freq: 293.66, color: "from-orange-200 to-orange-300" },
        { note: "E", freq: 329.63, color: "from-yellow-200 to-yellow-300" },
        { note: "F", freq: 349.23, color: "from-green-200 to-green-300" },
        { note: "G", freq: 392.00, color: "from-blue-200 to-blue-300" },
    ];

    const playNote = (freq: number) => {
        if (!soundEnabled) return;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
        oscillator.start();
        oscillator.stop(context.currentTime + 1);
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center mb-4">
                Gentle Music 🎵
            </h2>
            <p className="text-center text-purple-700 dark:text-purple-300 mb-6">
                Tap to play soft notes!
            </p>

            <div className="space-y-3">
                {notes.map(note => (
                    <motion.button
                        key={note.note}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => playNote(note.freq)}
                        className={`w-full p-6 bg-gradient-to-r ${note.color} rounded-2xl shadow-lg`}
                    >
                        <span className="text-2xl font-bold text-slate-800">{note.note}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
