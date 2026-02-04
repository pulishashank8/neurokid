"use client";

import { useState } from "react";
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TicTacToePage() {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });

    const winner = calculateWinner(board);
    const isDraw = !winner && board.every((square) => square !== null);

    const handleClick = (i: number) => {
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = xIsNext ? "X" : "O";
        setBoard(newBoard);
        setXIsNext(!xIsNext);

        // Check for win/draw immediately after move
        const newWinner = calculateWinner(newBoard);
        if (newWinner) {
            setScores(prev => ({ ...prev, [newWinner]: prev[newWinner as keyof typeof prev] + 1 }));
        } else if (newBoard.every((square) => square !== null)) {
            setScores(prev => ({ ...prev, Draws: prev.Draws + 1 }));
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
    };

    return (
        <div className="min-h-screen bg-indigo-50 dark:bg-slate-900 p-4">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/games" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Tic Tac Toe</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-indigo-100 dark:border-indigo-900">
                    <div className="flex justify-between items-center mb-6 bg-indigo-50 dark:bg-slate-900/50 p-4 rounded-xl">
                        <div className={`text-center transition-all ${xIsNext ? 'scale-110 font-bold' : 'opacity-50'}`}>
                            <div className="text-indigo-600 dark:text-indigo-400 text-2xl">X</div>
                            <div className="text-xs font-bold uppercase">Player 1</div>
                            <div className="font-mono">{scores.X}</div>
                        </div>
                        <div className="text-center opacity-50">
                            <div className="text-xs font-bold uppercase">Draws</div>
                            <div className="font-mono">{scores.Draws}</div>
                        </div>
                        <div className={`text-center transition-all ${!xIsNext ? 'scale-110 font-bold' : 'opacity-50'}`}>
                            <div className="text-amber-500 text-2xl">O</div>
                            <div className="text-xs font-bold uppercase">Player 2</div>
                            <div className="font-mono">{scores.O}</div>
                        </div>
                    </div>

                    <div className="status mb-6 text-center text-xl font-bold h-8">
                        {winner ? (
                            <span className="text-green-500 animate-bounce inline-block">Winner: {winner}! 🎉</span>
                        ) : isDraw ? (
                            <span className="text-slate-500">It's a Draw!</span>
                        ) : (
                            <span className="text-indigo-400">Next Player: <span className={xIsNext ? "text-indigo-600" : "text-amber-500"}>{xIsNext ? "X" : "O"}</span></span>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {board.map((square, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`h-24 rounded-xl text-5xl font-black flex items-center justify-center shadow-sm transition-colors ${square === "X"
                                        ? "bg-indigo-100 text-indigo-600"
                                        : square === "O"
                                            ? "bg-amber-100 text-amber-500"
                                            : "bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"
                                    }`}
                                onClick={() => handleClick(i)}
                                disabled={!!square || !!winner}
                            >
                                {square && (
                                    <motion.span
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                    >
                                        {square}
                                    </motion.span>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={resetGame}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        <RefreshCw className="w-5 h-5" />
                        New Game
                    </button>
                </div>
            </div>
        </div>
    );
}

function calculateWinner(squares: any[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

