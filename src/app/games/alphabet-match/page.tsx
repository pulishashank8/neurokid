"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Type } from "lucide-react";

const letters = [
  { upper: "A", lower: "a" },
  { upper: "B", lower: "b" },
  { upper: "C", lower: "c" },
  { upper: "D", lower: "d" },
  { upper: "E", lower: "e" },
  { upper: "F", lower: "f" },
];

export default function AlphabetMatchPage() {
  const [upperLetters, setUpperLetters] = useState<string[]>([]);
  const [lowerLetters, setLowerLetters] = useState<string[]>([]);
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    setUpperLetters([...letters.map(l => l.upper)].sort(() => Math.random() - 0.5));
    setLowerLetters([...letters.map(l => l.lower)].sort(() => Math.random() - 0.5));
    setSelectedUpper(null);
    setMatches([]);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleUpperClick = (letter: string) => {
    if (matches.includes(letter)) return;
    setSelectedUpper(letter);
  };

  const handleLowerClick = (letter: string) => {
    if (!selectedUpper) return;
    if (matches.includes(selectedUpper)) return;

    if (selectedUpper.toLowerCase() === letter) {
      const newMatches = [...matches, selectedUpper];
      setMatches(newMatches);
      setSelectedUpper(null);

      if (newMatches.length === letters.length) {
        setIsComplete(true);
      }
    } else {
      setSelectedUpper(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <Type className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Alphabet Match</h1>
                <p className="text-sm text-[var(--muted)]">Match uppercase with lowercase</p>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-blue-200 dark:border-blue-800/30 text-[var(--muted)] hover:text-blue-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-blue-200 dark:border-blue-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{matches.length}</span>
            <span className="text-[var(--muted)]">of {letters.length} matched</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <h3 className="text-center font-bold text-[var(--text)]">Uppercase</h3>
            <div className="grid grid-cols-3 gap-2">
              {upperLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleUpperClick(letter)}
                  disabled={matches.includes(letter)}
                  className={`aspect-square rounded-xl text-3xl font-bold flex items-center justify-center transition-all ${
                    matches.includes(letter)
                      ? "bg-green-100 dark:bg-green-900/30 text-green-500 border-2 border-green-300 dark:border-green-700"
                      : selectedUpper === letter
                        ? "bg-blue-500 text-white scale-105"
                        : "bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-800/30 hover:border-blue-400"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-center font-bold text-[var(--text)]">Lowercase</h3>
            <div className="grid grid-cols-3 gap-2">
              {lowerLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLowerClick(letter)}
                  disabled={matches.includes(letter.toUpperCase())}
                  className={`aspect-square rounded-xl text-3xl font-bold flex items-center justify-center transition-all ${
                    matches.includes(letter.toUpperCase())
                      ? "bg-green-100 dark:bg-green-900/30 text-green-500 border-2 border-green-300 dark:border-green-700"
                      : "bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-800/30 hover:border-blue-400"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800/40">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Perfect!</h2>
            <p className="text-[var(--muted)] mb-4">You matched all the letters!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Click an uppercase letter, then find its lowercase match!
          </p>
        </div>
      </div>
    </div>
  );
}

