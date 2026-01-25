"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star } from "lucide-react";

const items = ["⭐", "🌸", "🦋", "🍎", "🐢", "🌻"];

export default function CountingStarsPage() {
  const [count, setCount] = useState(0);
  const [displayItems, setDisplayItems] = useState<string[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const totalRounds = 8;

  const generateRound = () => {
    const itemCount = Math.floor(Math.random() * 8) + 1;
    const emoji = items[Math.floor(Math.random() * items.length)];
    const itemArray = Array(itemCount).fill(emoji);
    
    setCount(itemCount);
    setDisplayItems(itemArray);
    
    const wrongOptions: number[] = [];
    while (wrongOptions.length < 2) {
      const wrong = Math.floor(Math.random() * 9) + 1;
      if (wrong !== itemCount && !wrongOptions.includes(wrong)) {
        wrongOptions.push(wrong);
      }
    }
    setOptions([itemCount, ...wrongOptions].sort(() => Math.random() - 0.5));
  };

  const initializeGame = () => {
    setScore(0);
    setRound(1);
    setShowResult(null);
    setIsComplete(false);
    generateRound();
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleAnswer = (answer: number) => {
    const isCorrect = answer === count;
    setShowResult(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      if (round < totalRounds) {
        setRound(r => r + 1);
        generateRound();
      } else {
        setIsComplete(true);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 py-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Counting Stars</h1>
                <p className="text-sm text-[var(--muted)]">Count and pick the number</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-yellow-200 dark:border-yellow-800/30 text-[var(--muted)] hover:text-yellow-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-yellow-200 dark:border-yellow-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">correct</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              Round {round} of {totalRounds}
            </span>
          </div>
        </div>

        {!isComplete ? (
          <>
            {/* Items Display */}
            <div className="mb-6 p-6 rounded-xl bg-white dark:bg-white/5 border border-yellow-200 dark:border-yellow-900/40 text-center">
              <p className="text-sm text-[var(--muted)] mb-4">How many do you see?</p>
              <div className="flex flex-wrap gap-3 justify-center min-h-[100px] items-center">
                {displayItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-4xl animate-bounce"
                    style={{ animationDelay: `${idx * 100}ms`, animationDuration: "1s" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              {showResult && (
                <p className={`mt-4 text-lg font-medium ${
                  showResult === "correct" ? "text-green-600" : "text-red-500"
                }`}>
                  {showResult === "correct" ? `Yes! There are ${count}!` : `There are actually ${count}`}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult !== null}
                  className={`py-6 rounded-xl text-3xl font-bold border transition-all ${
                    showResult && option === count
                      ? "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700"
                      : showResult && option !== count
                        ? "opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-200"
                        : "bg-white dark:bg-white/5 border-yellow-200 dark:border-yellow-900/40 hover:border-yellow-400 hover:scale-105"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800/40">
            <div className="text-4xl mb-3">🎊</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Counting complete!</h2>
            <p className="text-[var(--muted)] mb-4">You got {score} out of {totalRounds} correct!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-yellow-100 dark:border-yellow-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Point to each one as you count. 1, 2, 3...
          </p>
        </div>
      </div>
    </div>
  );
}
