"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, ListOrdered, Check } from "lucide-react";

const sequences = [
  {
    title: "Getting Ready for Bed",
    steps: ["🛁 Take a bath", "🪥 Brush teeth", "📚 Read a story", "😴 Go to sleep"],
  },
  {
    title: "Making a Sandwich",
    steps: ["🍞 Get bread", "🥜 Add peanut butter", "🍓 Add jelly", "🥪 Put together"],
  },
  {
    title: "Planting a Flower",
    steps: ["🪴 Get a pot", "🌱 Add soil", "🌷 Plant seed", "💧 Water it"],
  },
  {
    title: "Morning Routine",
    steps: ["⏰ Wake up", "🧺 Get dressed", "🥣 Eat breakfast", "🎒 Go to school"],
  },
  {
    title: "Washing Hands",
    steps: ["💧 Turn on water", "🧼 Add soap", "👏 Rub hands", "🧻 Dry with towel"],
  },
];

export default function SequenceBuilderPage() {
  const [currentSequence, setCurrentSequence] = useState(0);
  const [shuffledSequences, setShuffledSequences] = useState(sequences);
  const [shuffledSteps, setShuffledSteps] = useState<string[]>([]);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const initializeRound = (seqIndex: number) => {
    const sequence = shuffledSequences[seqIndex];
    setShuffledSteps([...sequence.steps].sort(() => Math.random() - 0.5));
    setUserOrder([]);
    setShowResult(false);
  };

  const initializeGame = () => {
    const shuffled = [...sequences].sort(() => Math.random() - 0.5);
    setShuffledSequences(shuffled);
    setCurrentSequence(0);
    setScore(0);
    setIsComplete(false);
    setTimeout(() => initializeRound(0), 0);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleStepClick = (step: string) => {
    if (userOrder.includes(step) || showResult) return;
    
    const newOrder = [...userOrder, step];
    setUserOrder(newOrder);
    
    if (newOrder.length === shuffledSequences[currentSequence].steps.length) {
      const isCorrect = newOrder.every((s, i) => s === shuffledSequences[currentSequence].steps[i]);
      if (isCorrect) setScore(s => s + 1);
      setShowResult(true);
      
      setTimeout(() => {
        if (currentSequence + 1 < shuffledSequences.length) {
          const nextIdx = currentSequence + 1;
          setCurrentSequence(nextIdx);
          initializeRound(nextIdx);
        } else {
          setIsComplete(true);
        }
      }, 1500);
    }
  };

  const handleUndo = () => {
    if (userOrder.length > 0 && !showResult) {
      setUserOrder(userOrder.slice(0, -1));
    }
  };

  const sequence = shuffledSequences[currentSequence];
  const isCorrect = showResult && userOrder.every((s, i) => s === sequence?.steps[i]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 py-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg">
                <ListOrdered className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Sequence Builder</h1>
                <p className="text-sm text-[var(--muted)]">Put steps in the right order</p>
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

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-teal-200 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">correct</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {currentSequence + 1} of {shuffledSequences.length}
            </span>
          </div>
        </div>

        {!isComplete && sequence ? (
          <>
            {/* Title */}
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-200 dark:border-teal-800/40 text-center">
              <p className="text-lg font-medium text-[var(--text)]">{sequence.title}</p>
              <p className="text-sm text-[var(--muted)]">Put the steps in order</p>
            </div>

            {/* User's order */}
            <div className="mb-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-teal-200 dark:border-teal-900/40 min-h-[180px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[var(--muted)]">Your order:</p>
                {userOrder.length > 0 && !showResult && (
                  <button 
                    onClick={handleUndo}
                    className="text-xs text-teal-600 hover:text-teal-700"
                  >
                    Undo last
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {userOrder.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      showResult
                        ? step === sequence.steps[idx]
                          ? "bg-green-100 dark:bg-green-900/30 border border-green-400"
                          : "bg-red-100 dark:bg-red-900/30 border border-red-400"
                        : "bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/40"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[var(--text)]">{step}</span>
                    {showResult && step === sequence.steps[idx] && (
                      <Check className="w-4 h-4 text-green-600 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available steps */}
            <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-teal-200 dark:border-teal-900/40">
              <p className="text-sm text-[var(--muted)] mb-3">Tap steps in order:</p>
              <div className="space-y-2">
                {shuffledSteps.filter(s => !userOrder.includes(s)).map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStepClick(step)}
                    disabled={showResult}
                    className="w-full p-3 rounded-lg text-left bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            {showResult && (
              <div className={`text-center p-4 rounded-xl ${
                isCorrect 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              }`}>
                {isCorrect ? "Perfect order!" : "Good try! Keep practicing!"}
              </div>
            )}
          </>
        ) : isComplete ? (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-200 dark:border-teal-800/40">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">All sequences complete!</h2>
            <p className="text-[var(--muted)] mb-4">You got {score} out of {shuffledSequences.length} in perfect order!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        ) : null}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-teal-100 dark:border-teal-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Think about what needs to happen first, then next, then last.
          </p>
        </div>
      </div>
    </div>
  );
}
