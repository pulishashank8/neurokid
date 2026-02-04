"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Puzzle } from "lucide-react";

const patterns = [
  { sequence: ["🌸", "🌼", "🌸", "🌼"], answer: "🌸", options: ["🌸", "🌺", "🌻"] },
  { sequence: ["🐱", "🐶", "🐱", "🐶"], answer: "🐱", options: ["🐰", "🐱", "🐸"] },
  { sequence: ["⭐", "⭐", "🌙", "⭐", "⭐"], answer: "🌙", options: ["☀️", "🌙", "⭐"] },
  { sequence: ["🔴", "🔵", "🔴", "🔵"], answer: "🔴", options: ["🟢", "🔴", "🟡"] },
  { sequence: ["🍎", "🍊", "🍋", "🍎", "🍊"], answer: "🍋", options: ["🍇", "🍋", "🍎"] },
  { sequence: ["🦋", "🌺", "🦋", "🌺"], answer: "🦋", options: ["🦋", "🐝", "🌸"] },
];

export default function PatternCompletePage() {
  const [currentPattern, setCurrentPattern] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [shuffledPatterns, setShuffledPatterns] = useState(patterns);

  const initializeGame = () => {
    setShuffledPatterns([...patterns].sort(() => Math.random() - 0.5));
    setCurrentPattern(0);
    setScore(0);
    setShowResult(null);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === shuffledPatterns[currentPattern].answer;
    setShowResult(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      if (currentPattern + 1 < shuffledPatterns.length) {
        setCurrentPattern(c => c + 1);
      } else {
        setIsComplete(true);
      }
    }, 1000);
  };

  const pattern = shuffledPatterns[currentPattern];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg">
                <Puzzle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Pattern Complete</h1>
                <p className="text-sm text-[var(--muted)]">Finish the pattern</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-emerald-200 dark:border-emerald-800/30 text-[var(--muted)] hover:text-emerald-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">correct</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              Pattern {currentPattern + 1} of {shuffledPatterns.length}
            </span>
          </div>
        </div>

        {!isComplete ? (
          <>
            {/* Pattern Display */}
            <div className="mb-6 p-6 rounded-xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-900/40">
              <p className="text-sm text-[var(--muted)] mb-4 text-center">What comes next?</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {pattern.sequence.map((item, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl"
                  >
                    {item}
                  </div>
                ))}
                <div className={`w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center text-3xl transition-all ${
                  showResult === "correct" 
                    ? "bg-green-200 border-green-400" 
                    : showResult === "wrong"
                      ? "bg-red-200 border-red-400"
                      : "bg-gray-100 dark:bg-gray-800 border-emerald-400"
                }`}>
                  {showResult === "correct" ? pattern.answer : showResult === "wrong" ? "❌" : "?"}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {pattern.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult !== null}
                  className="aspect-square rounded-xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-900/40 text-5xl flex items-center justify-center hover:scale-105 hover:border-emerald-400 transition-all disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Result feedback */}
            {showResult && (
              <div className={`text-center p-4 rounded-xl ${
                showResult === "correct" 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}>
                {showResult === "correct" ? "✓ Great job!" : "Try again next time!"}
              </div>
            )}
          </>
        ) : (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800/40">
            <div className="text-4xl mb-3">🧩</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">All patterns complete!</h2>
            <p className="text-[var(--muted)] mb-4">You got {score} out of {shuffledPatterns.length} correct!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look at the order of items. Do you see what repeats?
          </p>
        </div>
      </div>
    </div>
  );
}

