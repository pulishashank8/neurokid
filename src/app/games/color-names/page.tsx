"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Paintbrush } from "lucide-react";

const colors = [
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Orange", hex: "#F97316" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Brown", hex: "#92400E" },
];

export default function ColorNamesPage() {
  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const setupRound = () => {
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const wrongOptions = shuffled.slice(1, 3).map(c => c.name);
    const allOptions = [correct.name, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentColor(correct);
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

    if (name === currentColor.name) {
      setScore(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg">
                <Paintbrush className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Color Names</h1>
                <p className="text-sm text-[var(--muted)]">What color is this?</p>
              </div>
            </div>

            <button
              onClick={setupRound}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-fuchsia-200 dark:border-fuchsia-800/30 text-[var(--muted)] hover:text-fuchsia-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-fuchsia-200 dark:border-fuchsia-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Score: {score}</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div
            className="w-48 h-48 rounded-3xl shadow-2xl transition-all"
            style={{ backgroundColor: currentColor.hex }}
          />
        </div>

        <p className="text-center text-xl font-bold text-[var(--text)] mb-6">
          What color is this?
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {options.map((name) => {
            const color = colors.find(c => c.name === name);
            return (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                disabled={showResult}
                className={`p-4 rounded-2xl font-bold transition-all ${
                  showResult
                    ? name === currentColor.name
                      ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-600"
                      : selected === name
                        ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-600"
                        : "bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-gray-800"
                    : "bg-white dark:bg-white/10 border-2 border-fuchsia-200 dark:border-fuchsia-800/30 hover:border-fuchsia-400 hover:scale-105"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: color?.hex }}
                />
                {name}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="text-center">
            <p className="text-xl font-bold mb-4 text-[var(--text)]">
              {selected === currentColor.name ? "🎉 Correct!" : `That's ${currentColor.name}!`}
            </p>
            <button
              onClick={setupRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Next Color
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-fuchsia-100 dark:border-fuchsia-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look around your room - can you find something that's the same color?
          </p>
        </div>
      </div>
    </div>
  );
}

