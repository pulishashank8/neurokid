"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, SortAsc } from "lucide-react";

export default function NumberOrderPage() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    const shuffled = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
    setSelected([]);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleNumberClick = (num: number) => {
    if (selected.includes(num)) return;

    const expectedNext = selected.length + 1;
    if (num === expectedNext) {
      const newSelected = [...selected, num];
      setSelected(newSelected);

      if (newSelected.length === 6) {
        setIsComplete(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg">
                <SortAsc className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Number Order</h1>
                <p className="text-sm text-[var(--muted)]">Count from 1 to 6 in order</p>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-purple-800/30 text-[var(--muted)] hover:text-purple-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-900/40">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[var(--muted)]">Next number:</span>
            <span className="text-2xl font-bold text-purple-500">{selected.length + 1}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={selected.includes(num)}
              className={`aspect-square rounded-2xl text-5xl font-bold flex items-center justify-center transition-all ${
                selected.includes(num)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-500 border-2 border-green-300 dark:border-green-700"
                  : "bg-gradient-to-br from-purple-400 to-violet-500 text-white hover:scale-105 active:scale-95 cursor-pointer"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{selected.length}</span>
            <span className="text-[var(--muted)]">of 6 in order</span>
          </div>
        </div>

        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800/40">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Excellent!</h2>
            <p className="text-[var(--muted)] mb-4">You counted 1 to 6 perfectly!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-purple-100 dark:border-purple-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Find and tap the numbers in order: 1, 2, 3, 4, 5, 6!
          </p>
        </div>
      </div>
    </div>
  );
}

