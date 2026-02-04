"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, MessageCircle } from "lucide-react";

const scenarios = [
  {
    situation: "Someone says 'Hello!' to you",
    correct: "Hello! How are you?",
    options: ["Hello! How are you?", "Goodbye!", "I don't know"]
  },
  {
    situation: "You want to play with someone",
    correct: "Can I play with you?",
    options: ["Go away!", "Can I play with you?", "Give me that!"]
  },
  {
    situation: "Someone shares their toy with you",
    correct: "Thank you!",
    options: ["Thank you!", "I don't want it", "Whatever"]
  },
  {
    situation: "You accidentally bump into someone",
    correct: "I'm sorry!",
    options: ["I'm sorry!", "Watch where you're going!", "..."]
  },
  {
    situation: "You need help with something",
    correct: "Can you help me please?",
    options: ["Help me now!", "Can you help me please?", "I'll do it myself"]
  },
  {
    situation: "Someone asks your name",
    correct: "My name is... Nice to meet you!",
    options: ["Why do you want to know?", "My name is... Nice to meet you!", "None of your business"]
  },
];

export default function ConversationPracticePage() {
  const [currentScenario, setCurrentScenario] = useState(scenarios[0]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);

  const setupRound = () => {
    const scenario = scenarios[round % scenarios.length];
    setCurrentScenario(scenario);
    setSelected(null);
    setShowResult(false);
  };

  useEffect(() => {
    setupRound();
  }, [round]);

  const handleSelect = (answer: string) => {
    if (showResult) return;
    setSelected(answer);
    setShowResult(true);

    if (answer === currentScenario.correct) {
      setScore(s => s + 1);
    }
  };

  const nextRound = () => {
    setRound(r => r + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Conversation Practice</h1>
                <p className="text-sm text-[var(--muted)]">Learn what to say</p>
              </div>
            </div>

            <button
              onClick={() => { setRound(0); setScore(0); }}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-800/30 text-[var(--muted)] hover:text-indigo-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Score: {score}</span>
          </div>
        </div>

        <div className="mb-6 p-6 rounded-2xl bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-900/40">
          <p className="text-[var(--muted)] text-sm mb-2">Situation:</p>
          <p className="text-xl font-bold text-[var(--text)]">{currentScenario.situation}</p>
          <p className="text-[var(--muted)] mt-4">What should you say?</p>
        </div>

        <div className="space-y-3 mb-6">
          {currentScenario.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                showResult
                  ? option === currentScenario.correct
                    ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-300"
                    : selected === option
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300"
                      : "bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-gray-800 text-[var(--text)]"
                  : "bg-white dark:bg-white/10 border-2 border-indigo-200 dark:border-indigo-800/30 hover:border-indigo-400 text-[var(--text)]"
              }`}
            >
              💬 {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="text-center">
            <p className="text-xl font-bold mb-4 text-[var(--text)]">
              {selected === currentScenario.correct
                ? "🎉 Perfect response!"
                : `Good try! The best answer is: "${currentScenario.correct}"`}
            </p>
            <button
              onClick={nextRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Next Situation
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Think about how the other person would feel when you respond!
          </p>
        </div>
      </div>
    </div>
  );
}

