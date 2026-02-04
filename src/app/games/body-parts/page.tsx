"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, User } from "lucide-react";

const bodyParts = [
  { name: "Head", emoji: "🗣️", position: "top" },
  { name: "Hand", emoji: "🖐️", position: "middle" },
  { name: "Foot", emoji: "🦶", position: "bottom" },
  { name: "Eye", emoji: "👁️", position: "top" },
  { name: "Ear", emoji: "👂", position: "top" },
  { name: "Nose", emoji: "👃", position: "top" },
];

export default function BodyPartsPage() {
  const [currentPart, setCurrentPart] = useState(bodyParts[0]);
  const [options, setOptions] = useState<typeof bodyParts>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const setupRound = () => {
    const shuffled = [...bodyParts].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const wrongOptions = shuffled.slice(1, 3);
    const allOptions = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentPart(correct);
    setOptions(allOptions);
    setSelected(null);
    setShowResult(false);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleSelect = (name: string) => {
    if (showResult) return;
    setSelected(name);
    setShowResult(true);

    if (name === currentPart.name) {
      setScore(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Body Parts</h1>
                <p className="text-sm text-[var(--muted)]">Learn about your body</p>
              </div>
            </div>

            <button
              onClick={setupRound}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-rose-200 dark:border-rose-800/30 text-[var(--muted)] hover:text-rose-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Score: {score}</span>
          </div>
        </div>

        <div className="mb-6 p-8 rounded-2xl bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-900/40 text-center">
          <p className="text-[var(--muted)] mb-2">Find the:</p>
          <p className="text-4xl font-bold text-rose-500">{currentPart.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {options.map((part) => (
            <button
              key={part.name}
              onClick={() => handleSelect(part.name)}
              disabled={showResult}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                showResult
                  ? part.name === currentPart.name
                    ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                    : selected === part.name
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                      : "bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-gray-800"
                  : "bg-white dark:bg-white/10 border-2 border-rose-200 dark:border-rose-800/30 hover:border-rose-400 hover:scale-105"
              }`}
            >
              <span className="text-6xl">{part.emoji}</span>
              <span className="font-bold text-[var(--text)]">{part.name}</span>
            </button>
          ))}
        </div>

        {showResult && (
          <div className="text-center">
            <p className="text-xl font-bold mb-4 text-[var(--text)]">
              {selected === currentPart.name ? "🎉 Great job!" : "Keep learning!"}
            </p>
            <button
              onClick={setupRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Next Body Part
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-rose-100 dark:border-rose-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Point to the body part on yourself as you learn!
          </p>
        </div>
      </div>
    </div>
  );
}

