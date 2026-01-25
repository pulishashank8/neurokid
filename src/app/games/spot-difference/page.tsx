"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Search, Check } from "lucide-react";

const puzzles = [
  {
    baseItems: ["🌸", "🌻", "🌺", "🌷", "🌹", "🌸"],
    differentIndex: 5,
    differentItem: "🌼",
    hint: "Look for a different flower",
  },
  {
    baseItems: ["🐱", "🐱", "🐱", "🐱", "🐶", "🐱"],
    differentIndex: 4,
    differentItem: "🐶",
    hint: "One is not a cat",
  },
  {
    baseItems: ["⭐", "⭐", "🌟", "⭐", "⭐", "⭐"],
    differentIndex: 2,
    differentItem: "🌟",
    hint: "One star is special",
  },
  {
    baseItems: ["🍎", "🍎", "🍎", "🍊", "🍎", "🍎"],
    differentIndex: 3,
    differentItem: "🍊",
    hint: "Look for a different fruit",
  },
  {
    baseItems: ["🔵", "🔵", "🔵", "🔵", "🟣", "🔵"],
    differentIndex: 4,
    differentItem: "🟣",
    hint: "One color is different",
  },
  {
    baseItems: ["🐦", "🐦", "🦋", "🐦", "🐦", "🐦"],
    differentIndex: 2,
    differentItem: "🦋",
    hint: "One is not a bird",
  },
];

export default function SpotDifferencePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [shuffledPuzzles, setShuffledPuzzles] = useState(puzzles);
  const [displayItems, setDisplayItems] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const setupPuzzle = (puzzleIdx: number) => {
    const puzzle = shuffledPuzzles[puzzleIdx];
    const items = [...puzzle.baseItems];
    items[puzzle.differentIndex] = puzzle.differentItem;
    setDisplayItems(items);
    setShowHint(false);
  };

  const initializeGame = () => {
    const shuffled = [...puzzles].sort(() => Math.random() - 0.5);
    setShuffledPuzzles(shuffled);
    setCurrentPuzzle(0);
    setScore(0);
    setShowResult(null);
    setIsComplete(false);
    setTimeout(() => {
      const items = [...shuffled[0].baseItems];
      items[shuffled[0].differentIndex] = shuffled[0].differentItem;
      setDisplayItems(items);
    }, 0);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleItemClick = (index: number) => {
    if (showResult) return;
    
    const puzzle = shuffledPuzzles[currentPuzzle];
    const isCorrect = index === puzzle.differentIndex;
    setShowResult(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      if (currentPuzzle + 1 < shuffledPuzzles.length) {
        const nextIdx = currentPuzzle + 1;
        setCurrentPuzzle(nextIdx);
        setupPuzzle(nextIdx);
      } else {
        setIsComplete(true);
      }
    }, 1200);
  };

  const puzzle = shuffledPuzzles[currentPuzzle];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center shadow-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Spot the Difference</h1>
                <p className="text-sm text-[var(--muted)]">Find what's different</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-rose-200 dark:border-rose-800/30 text-[var(--muted)] hover:text-rose-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">found</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {currentPuzzle + 1} of {shuffledPuzzles.length}
            </span>
          </div>
        </div>

        {!isComplete && puzzle ? (
          <>
            {/* Puzzle */}
            <div className="mb-6 p-6 rounded-xl bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-900/40 text-center">
              <p className="text-sm text-[var(--muted)] mb-4">Tap the one that's different!</p>
              
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {displayItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(idx)}
                    disabled={showResult !== null}
                    className={`aspect-square rounded-xl text-4xl flex items-center justify-center transition-all ${
                      showResult && idx === puzzle.differentIndex
                        ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-400 scale-110"
                        : showResult && idx !== puzzle.differentIndex
                          ? "opacity-50 bg-gray-100 dark:bg-gray-800"
                          : "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 hover:scale-105 hover:border-rose-400"
                    }`}
                  >
                    {item}
                    {showResult && idx === puzzle.differentIndex && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {showResult && (
                <p className={`mt-4 text-lg font-medium ${
                  showResult === "correct" ? "text-green-600" : "text-red-500"
                }`}>
                  {showResult === "correct" ? "You found it!" : "Try again!"}
                </p>
              )}
            </div>

            {/* Hint */}
            <div className="mb-6 text-center">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-sm text-rose-500 hover:text-rose-600"
                >
                  Need a hint?
                </button>
              ) : (
                <p className="text-sm text-[var(--muted)] p-3 rounded-lg bg-rose-100 dark:bg-rose-900/20">
                  Hint: {puzzle.hint}
                </p>
              )}
            </div>
          </>
        ) : isComplete ? (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 border border-rose-200 dark:border-rose-800/40">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Sharp eyes!</h2>
            <p className="text-[var(--muted)] mb-4">You found {score} out of {shuffledPuzzles.length} differences!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-400 to-pink-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        ) : null}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-rose-100 dark:border-rose-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look at each one slowly. One is not like the others!
          </p>
        </div>
      </div>
    </div>
  );
}
