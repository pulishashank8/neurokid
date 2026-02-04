"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RefreshCw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200;

export default function SnakeGamePage() {
    const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
    const [food, setFood] = useState({ x: 10, y: 10 });
    const [direction, setDirection] = useState("RIGHT");
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const boardRef = useRef<HTMLDivElement>(null);

    const moveSnake = useCallback(() => {
        if (gameOver || !gameStarted) return;

        setSnake((prevSnake) => {
            const newHead = { ...prevSnake[0] };

            switch (direction) {
                case "UP": newHead.y -= 1; break;
                case "DOWN": newHead.y += 1; break;
                case "LEFT": newHead.x -= 1; break;
                case "RIGHT": newHead.x += 1; break;
            }

            // Check collision with walls
            if (
                newHead.x < 0 ||
                newHead.x >= GRID_SIZE ||
                newHead.y < 0 ||
                newHead.y >= GRID_SIZE
            ) {
                setGameOver(true);
                return prevSnake;
            }

            // Check collision with self
            if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
                setGameOver(true);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Check collision with food
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore((s) => s + 1);
                generateFood(newSnake);
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, gameOver, gameStarted]);

    useEffect(() => {
        const interval = setInterval(moveSnake, Math.max(50, INITIAL_SPEED - score * 5));
        return () => clearInterval(interval);
    }, [moveSnake, score]);

    useEffect(() => {
        if (score > highScore) setHighScore(score);
    }, [score, highScore]);

    const generateFood = (currentSnake: any[]) => {
        let newFood: { x: number; y: number };
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
        } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
        setFood(newFood);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowUp": if (direction !== "DOWN") setDirection("UP"); break;
            case "ArrowDown": if (direction !== "UP") setDirection("DOWN"); break;
            case "ArrowLeft": if (direction !== "RIGHT") setDirection("LEFT"); break;
            case "ArrowRight": if (direction !== "LEFT") setDirection("RIGHT"); break;
        }
    }, [direction]);

    useEffect(() => {
        // Mobile controls prevent default scrolling
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const resetGame = () => {
        setSnake([{ x: 7, y: 7 }]);
        setFood({ x: 10, y: 10 });
        setDirection("RIGHT");
        setGameOver(false);
        setScore(0);
        setGameStarted(true);
    };

    return (
        <div className="min-h-screen bg-green-50 dark:bg-slate-900 p-4 select-none touch-none">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/games" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                        <ArrowLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">Snake</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-green-100 dark:border-green-900">
                    <div className="flex justify-between items-center mb-6 bg-green-50 dark:bg-slate-900/50 p-4 rounded-xl">
                        <div className="text-center">
                            <div className="text-xs font-bold uppercase text-green-600">Score</div>
                            <div className="font-mono text-2xl font-bold">{score}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold uppercase text-amber-500">High Score</div>
                            <div className="font-mono text-2xl font-bold">{highScore}</div>
                        </div>
                    </div>

                    <div
                        className="relative bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mx-auto shadow-inner"
                        style={{
                            width: "100%",
                            aspectRatio: "1/1",
                            display: "grid",
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                        }}
                        onClick={() => !gameStarted && !gameOver && setGameStarted(true)}
                    >
                        {/* Game Board */}
                        {!gameStarted && !gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 cursor-pointer">
                                <p className="font-bold text-green-700 animate-pulse">Tap to Start</p>
                            </div>
                        )}

                        {gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                                <p className="text-3xl font-black text-white mb-2">Game Over</p>
                                <p className="text-white mb-4">Score: {score}</p>
                                <button onClick={resetGame} className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                                    Play Again
                                </button>
                            </div>
                        )}

                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                            const x = i % GRID_SIZE;
                            const y = Math.floor(i / GRID_SIZE);
                            const isSnake = snake.some(s => s.x === x && s.y === y);
                            const isHead = snake[0].x === x && snake[0].y === y;
                            const isFood = food.x === x && food.y === y;

                            return (
                                <div
                                    key={i}
                                    className={`
                            ${isSnake ? 'bg-green-500 rounded-sm' : ''}
                            ${isHead ? 'bg-green-600 rounded-full scale-110 z-10' : ''}
                            ${isFood ? 'bg-red-500 rounded-full animate-bounce' : ''}
                        `}
                                />
                            );
                        })}
                    </div>

                    {/* D-Pad Controls */}
                    <div className="mt-8 grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                        <div />
                        <button
                            className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center active:bg-green-200"
                            onClick={() => direction !== "DOWN" && setDirection("UP")}
                        >
                            <ChevronUp className="w-8 h-8 text-slate-500" />
                        </button>
                        <div />

                        <button
                            className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center active:bg-green-200"
                            onClick={() => direction !== "RIGHT" && setDirection("LEFT")}
                        >
                            <ChevronLeft className="w-8 h-8 text-slate-500" />
                        </button>
                        <button
                            className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center active:bg-green-200"
                            onClick={() => direction !== "UP" && setDirection("DOWN")}
                        >
                            <ChevronDown className="w-8 h-8 text-slate-500" />
                        </button>
                        <button
                            className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center active:bg-green-200"
                            onClick={() => direction !== "LEFT" && setDirection("RIGHT")}
                        >
                            <ChevronRight className="w-8 h-8 text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

