"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const ROAD_WIDTH = 300;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 60;

export default function CarRacingPage() {
    const [carPosition, setCarPosition] = useState(ROAD_WIDTH / 2 - CAR_WIDTH / 2);
    const [obstacles, setObstacles] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [speed, setSpeed] = useState(5);
    const gameLoopRef = useRef<number | undefined>(undefined);
    const obstacleIdRef = useRef(0);

    const moveLeft = () => {
        setCarPosition(prev => Math.max(0, prev - 20));
    };

    const moveRight = () => {
        setCarPosition(prev => Math.min(ROAD_WIDTH - CAR_WIDTH, prev + 20));
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") moveLeft();
        if (e.key === "ArrowRight") moveRight();
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const checkCollision = (carX: number, obstacleX: number, obstacleY: number) => {
        const carY = 400; // Fixed car Y position
        return (
            carX < obstacleX + CAR_WIDTH &&
            carX + CAR_WIDTH > obstacleX &&
            carY < obstacleY + CAR_HEIGHT &&
            carY + CAR_HEIGHT > obstacleY
        );
    };

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const gameLoop = () => {
            setObstacles(prev => {
                const updated = prev
                    .map(obs => ({ ...obs, y: obs.y + speed }))
                    .filter(obs => obs.y < 500);

                // Check collisions
                updated.forEach(obs => {
                    if (checkCollision(carPosition, obs.x, obs.y)) {
                        setGameOver(true);
                        if (score > highScore) setHighScore(score);
                    }
                });

                // Add new obstacles
                if (Math.random() < 0.02) {
                    const lanes = [20, ROAD_WIDTH / 2 - CAR_WIDTH / 2, ROAD_WIDTH - CAR_WIDTH - 20];
                    const lane = lanes[Math.floor(Math.random() * lanes.length)];
                    updated.push({
                        x: lane,
                        y: -CAR_HEIGHT,
                        id: obstacleIdRef.current++,
                    });
                }

                return updated;
            });

            setScore(prev => prev + 1);
            setSpeed(prev => Math.min(12, prev + 0.001)); // Gradually increase speed

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameStarted, gameOver, carPosition, score, highScore, speed]);

    const resetGame = () => {
        setCarPosition(ROAD_WIDTH / 2 - CAR_WIDTH / 2);
        setObstacles([]);
        setScore(0);
        setSpeed(5);
        setGameOver(false);
        setGameStarted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-700 to-gray-900 p-4 pt-20">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/games" className="p-2 bg-gray-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-blue-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Car Racing</h1>
                </div>

                <div className="bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-700">
                    {/* Score Display */}
                    <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 rounded-xl">
                        <div className="text-center">
                            <div className="text-xs font-bold uppercase text-blue-400">Score</div>
                            <div className="font-mono text-2xl font-bold text-white">{Math.floor(score / 10)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold uppercase text-yellow-400">High Score</div>
                            <div className="font-mono text-2xl font-bold text-white">{Math.floor(highScore / 10)}</div>
                        </div>
                    </div>

                    {/* Game Area */}
                    <div
                        className="relative bg-gray-600 rounded-xl overflow-hidden mx-auto"
                        style={{ width: ROAD_WIDTH, height: 500 }}
                    >
                        {/* Road markings */}
                        <div className="absolute inset-0 flex justify-around">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="w-2 h-full flex flex-col justify-around">
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
                                        <motion.div
                                            key={j}
                                            className="w-2 h-12 bg-white rounded"
                                            animate={{ y: [0, 100] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Start Screen */}
                        {!gameStarted && !gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                                <button
                                    onClick={resetGame}
                                    className="bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
                                >
                                    Start Race! 🏁
                                </button>
                            </div>
                        )}

                        {/* Game Over Screen */}
                        {gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                                <p className="text-4xl font-black text-white mb-2">Crash! 💥</p>
                                <p className="text-white mb-4">Score: {Math.floor(score / 10)}</p>
                                <button
                                    onClick={resetGame}
                                    className="bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                                >
                                    Race Again
                                </button>
                            </div>
                        )}

                        {/* Player Car */}
                        <motion.div
                            className="absolute bottom-20 transition-all duration-200"
                            style={{ left: carPosition, width: CAR_WIDTH, height: CAR_HEIGHT }}
                        >
                            <div className="w-full h-full bg-blue-500 rounded-lg shadow-lg relative">
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-8 bg-blue-300 rounded-t-lg" />
                                <div className="absolute bottom-1 left-1 w-2 h-3 bg-black rounded" />
                                <div className="absolute bottom-1 right-1 w-2 h-3 bg-black rounded" />
                            </div>
                        </motion.div>

                        {/* Obstacles */}
                        {obstacles.map(obs => (
                            <div
                                key={obs.id}
                                className="absolute transition-none"
                                style={{ left: obs.x, top: obs.y, width: CAR_WIDTH, height: CAR_HEIGHT }}
                            >
                                <div className="w-full h-full bg-red-500 rounded-lg shadow-lg relative">
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-8 bg-red-300 rounded-t-lg" />
                                    <div className="absolute bottom-1 left-1 w-2 h-3 bg-black rounded" />
                                    <div className="absolute bottom-1 right-1 w-2 h-3 bg-black rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="mt-6 flex justify-center gap-4">
                        <button
                            onClick={moveLeft}
                            className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg"
                        >
                            <ChevronLeft className="w-10 h-10 text-white" />
                        </button>
                        <button
                            onClick={moveRight}
                            className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg"
                        >
                            <ChevronRight className="w-10 h-10 text-white" />
                        </button>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-gray-900 border border-gray-700">
                        <p className="text-xs text-center text-gray-400">
                            🏎️ Use arrow keys or buttons to dodge other cars!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
