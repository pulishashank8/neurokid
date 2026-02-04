"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Clock } from "lucide-react";

const times = [
  { hour: 12, minute: 0, display: "12:00" },
  { hour: 3, minute: 0, display: "3:00" },
  { hour: 6, minute: 0, display: "6:00" },
  { hour: 9, minute: 0, display: "9:00" },
  { hour: 12, minute: 30, display: "12:30" },
  { hour: 3, minute: 30, display: "3:30" },
];

export default function TellingTimePage() {
  const [currentTime, setCurrentTime] = useState(times[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const setupRound = () => {
    const shuffled = [...times].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const wrongOptions = shuffled.slice(1, 3).map(t => t.display);
    const allOptions = [correct.display, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentTime(correct);
    setOptions(allOptions);
    setSelected(null);
    setShowResult(false);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleSelect = (time: string) => {
    if (showResult) return;
    setSelected(time);
    setShowResult(true);

    if (time === currentTime.display) {
      setScore(s => s + 1);
    }
  };

  // Calculate clock hand positions
  const hourDeg = (currentTime.hour % 12) * 30 + currentTime.minute * 0.5;
  const minuteDeg = currentTime.minute * 6;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Telling Time</h1>
                <p className="text-sm text-[var(--muted)]">What time does the clock show?</p>
              </div>
            </div>

            <button
              onClick={setupRound}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-cyan-200 dark:border-cyan-800/30 text-[var(--muted)] hover:text-cyan-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-cyan-200 dark:border-cyan-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Score: {score}</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48 rounded-full bg-white dark:bg-white/10 border-4 border-cyan-300 dark:border-cyan-700 shadow-xl">
            {/* Clock numbers */}
            {[12, 3, 6, 9].map((num) => (
              <div
                key={num}
                className="absolute text-lg font-bold text-[var(--text)]"
                style={{
                  top: num === 12 ? "8px" : num === 6 ? "auto" : "50%",
                  bottom: num === 6 ? "8px" : "auto",
                  left: num === 9 ? "12px" : num === 3 ? "auto" : "50%",
                  right: num === 3 ? "12px" : "auto",
                  transform: [12, 6].includes(num) ? "translateX(-50%)" : [3, 9].includes(num) ? "translateY(-50%)" : "none"
                }}
              >
                {num}
              </div>
            ))}
            {/* Hour hand */}
            <div
              className="absolute w-2 h-16 bg-gray-800 dark:bg-white rounded-full origin-bottom left-1/2 -translate-x-1/2 bottom-1/2"
              style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
            />
            {/* Minute hand */}
            <div
              className="absolute w-1.5 h-20 bg-cyan-500 rounded-full origin-bottom left-1/2 -translate-x-1/2 bottom-1/2"
              style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
            />
            {/* Center dot */}
            <div className="absolute w-4 h-4 bg-cyan-500 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {options.map((time) => (
            <button
              key={time}
              onClick={() => handleSelect(time)}
              disabled={showResult}
              className={`p-4 rounded-2xl text-2xl font-bold transition-all ${
                showResult
                  ? time === currentTime.display
                    ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-600"
                    : selected === time
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-600"
                      : "bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-gray-800"
                  : "bg-white dark:bg-white/10 border-2 border-cyan-200 dark:border-cyan-800/30 hover:border-cyan-400 hover:scale-105"
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="text-center">
            <p className="text-xl font-bold mb-4 text-[var(--text)]">
              {selected === currentTime.display ? "🎉 Correct!" : `The answer was ${currentTime.display}`}
            </p>
            <button
              onClick={setupRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Next Clock
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-cyan-100 dark:border-cyan-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: The short hand shows hours, the long hand shows minutes!
          </p>
        </div>
      </div>
    </div>
  );
}

