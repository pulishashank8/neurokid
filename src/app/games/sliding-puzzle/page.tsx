"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, LayoutDashboard } from "lucide-react";

export default function SlidingPuzzlePage() {
  const [tiles, setTiles] = useState<(number | null)[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    let newTiles: (number | null)[];
    do {
      newTiles = [1, 2, 3, 4, 5, 6, 7, 8, null].sort(() => Math.random() - 0.5);
    } while (!isSolvable(newTiles) || isWon(newTiles));

    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
  };

  const isSolvable = (puzzle: (number | null)[]) => {
    let inversions = 0;
    const nums = puzzle.filter((n): n is number => n !== null);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] > nums[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  };

  const isWon = (puzzle: (number | null)[]) => {
    for (let i = 0; i < 8; i++) {
      if (puzzle[i] !== i + 1) return false;
    }
    return puzzle[8] === null;
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleTileClick = (index: number) => {
    if (isComplete) return;

    const emptyIndex = tiles.indexOf(null);
    const validMoves = [
      emptyIndex - 3, // up
      emptyIndex + 3, // down
      emptyIndex % 3 !== 0 ? emptyIndex - 1 : -1, // left
      emptyIndex % 3 !== 2 ? emptyIndex + 1 : -1, // right
    ];

    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(m => m + 1);

      if (isWon(newTiles)) {
        setIsComplete(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Sliding Puzzle</h1>
                <p className="text-sm text-[var(--muted)]">Slide tiles to solve</p>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-teal-200 dark:border-teal-800/30 text-[var(--muted)] hover:text-teal-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-teal-200 dark:border-teal-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Moves: {moves}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
          {tiles.map((tile, index) => (
            <button
              key={index}
              onClick={() => handleTileClick(index)}
              disabled={tile === null}
              className={`aspect-square rounded-xl text-3xl font-bold flex items-center justify-center transition-all ${
                tile === null
                  ? "bg-teal-100 dark:bg-teal-900/20"
                  : "bg-gradient-to-br from-teal-400 to-cyan-500 text-white hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              }`}
            >
              {tile}
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-[var(--muted)]">Goal: Arrange numbers 1-8 in order</p>
        </div>

        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800/40">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Puzzle Solved!</h2>
            <p className="text-[var(--muted)] mb-4">You did it in {moves} moves!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-teal-100 dark:border-teal-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Click a tile next to the empty space to move it!
          </p>
        </div>
      </div>
    </div>
  );
}

