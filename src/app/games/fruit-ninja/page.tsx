"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Sword, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fruits = ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🥝", "🍑", "🍒"];
const bombs = ["💣"];

interface FallingItem {
    id: number;
    emoji: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    isBomb: boolean;
    sliced: boolean;
}

export default function FruitNinjaPage() {
    const [items, setItems] = useState<FallingItem[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [slashPath, setSlashPath] = useState<Array<{ x: number; y: number }>>([]);
    const itemIdRef = useRef(0);
    const gameLoopRef = useRef<number | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const spawnItem = () => {
        const isBomb = Math.random() < 0.15; // 15% chance of bomb
        const emoji = isBomb ? bombs[0] : fruits[Math.floor(Math.random() * fruits.length)];
        const x = Math.random() * 80 + 10; // 10-90% of width

        setItems(prev => [...prev, {
            id: itemIdRef.current++,
            emoji,
            x,
            y: 100,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 3 + 5), // Upward velocity
            isBomb,
            sliced: false,
        }]);
    };

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const spawnInterval = setInterval(() => {
            if (Math.random() < 0.6) spawnItem();
        }, 800);

        const gameLoop = () => {
            setItems(prev => {
                const updated = prev
                    .map(item => ({
                        ...item,
                        x: item.x + item.vx,
                        y: item.y + item.vy,
                        vy: item.vy + 0.2, // Gravity
                    }))
                    .filter(item => {
                        // Remove items that fell off screen
                        if (item.y > 110 && !item.sliced && !item.isBomb) {
                            setLives(l => {
                                const newLives = l - 1;
                                if (newLives <= 0) {
                                    setGameOver(true);
                                    if (score > highScore) setHighScore(score);
                                }
                                return newLives;
                            });
                            return false;
                        }
                        return item.y < 110 || item.sliced;
                    })
                    .filter(item => !item.sliced || item.y < 110);

                return updated;
            });

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            clearInterval(spawnInterval);
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameStarted, gameOver, score, highScore]);

    const handleSlice = (e: React.MouseEvent | React.TouchEvent) => {
        if (!gameStarted || gameOver) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setSlashPath(prev => [...prev, { x, y }]);

        // Check if any items were sliced
        setItems(prev => prev.map(item => {
            if (item.sliced) return item;

            const distance = Math.sqrt(
                Math.pow(item.x - x, 2) + Math.pow(item.y - y, 2)
            );

            if (distance < 8) {
                if (item.isBomb) {
                    setGameOver(true);
                    if (score > highScore) setHighScore(score);
                } else {
                    setScore(s => s + 1);
                }
                return { ...item, sliced: true };
            }

            return item;
        }));
    };

    const handleSliceEnd = () => {
        setTimeout(() => setSlashPath([]), 100);
    };

    const resetGame = () => {
        setItems([]);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameStarted(true);
        itemIdRef.current = 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-200 dark:from-slate-900 dark:to-slate-800 p-4 pt-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/games" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-orange-900 dark:text-orange-100">Fruit Ninja</h1>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-orange-900">
                    {/* HUD */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Sword className="w-6 h-6 text-orange-600" />
                            <span className="text-2xl font-bold text-orange-900 dark:text-white">{score}</span>
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Heart
                                    key={i}
                                    className={`w-6 h-6 ${i < lives ? "fill-red-500 text-red-500" : "text-gray-300"}`}
                                />
                            ))}
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-600 dark:text-gray-400">High Score</div>
                            <div className="text-xl font-bold text-orange-900 dark:text-white">{highScore}</div>
                        </div>
                    </div>

                    {/* Game Area */}
                    <div
                        ref={containerRef}
                        className="relative bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl overflow-hidden cursor-crosshair select-none"
                        style={{ height: "500px" }}
                        onMouseMove={handleSlice}
                        onMouseUp={handleSliceEnd}
                        onMouseLeave={handleSliceEnd}
                        onTouchMove={handleSlice}
                        onTouchEnd={handleSliceEnd}
                    >
                        {/* Start Screen */}
                        {!gameStarted && !gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
                                <button
                                    onClick={resetGame}
                                    className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
                                >
                                    Start Slicing! 🍉
                                </button>
                            </div>
                        )}

                        {/* Game Over Screen */}
                        {gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                                <p className="text-4xl font-black text-white mb-2">Game Over!</p>
                                <p className="text-white mb-4">Score: {score}</p>
                                <button
                                    onClick={resetGame}
                                    className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                                >
                                    Play Again
                                </button>
                            </div>
                        )}

                        {/* Slash Trail */}
                        <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: "100%", height: "100%" }}>
                            {slashPath.length > 1 && (
                                <motion.path
                                    d={`M ${slashPath.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                                    stroke="rgba(255, 255, 255, 0.8)"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.1 }}
                                />
                            )}
                        </svg>

                        {/* Falling Items */}
                        <AnimatePresence>
                            {items.map(item => (
                                <motion.div
                                    key={item.id}
                                    className="absolute text-6xl pointer-events-none"
                                    style={{
                                        left: `${item.x}%`,
                                        top: `${item.y}%`,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                    animate={{
                                        rotate: item.sliced ? [0, 180] : 0,
                                        scale: item.sliced ? [1, 0] : 1,
                                        opacity: item.sliced ? [1, 0] : 1,
                                    }}
                                    transition={{ duration: item.sliced ? 0.5 : 0 }}
                                >
                                    {item.sliced && !item.isBomb ? (
                                        <div className="relative">
                                            <span className="absolute" style={{ transform: "translateX(-20px)" }}>
                                                {item.emoji.slice(0, 1)}
                                            </span>
                                            <span className="absolute" style={{ transform: "translateX(20px)" }}>
                                                {item.emoji.slice(0, 1)}
                                            </span>
                                        </div>
                                    ) : (
                                        item.emoji
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            🗡️ Swipe to slice fruits! Avoid bombs 💣 and don't let fruits fall!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
