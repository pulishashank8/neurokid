"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wind, Play, Pause } from "lucide-react";

export default function BreathingExercisePage() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [isActive, setIsActive] = useState(false);
  const [scale, setScale] = useState(1);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const breathingCycle = async () => {
      // Inhale (4 seconds)
      setPhase("inhale");
      for (let i = 0; i <= 100; i++) {
        await new Promise(r => setTimeout(r, 40));
        setScale(1 + (i / 100) * 0.5);
      }

      // Hold (4 seconds)
      setPhase("hold");
      await new Promise(r => setTimeout(r, 4000));

      // Exhale (4 seconds)
      setPhase("exhale");
      for (let i = 100; i >= 0; i--) {
        await new Promise(r => setTimeout(r, 40));
        setScale(1 + (i / 100) * 0.5);
      }

      // Rest (2 seconds)
      setPhase("rest");
      await new Promise(r => setTimeout(r, 2000));

      setCycles(c => c + 1);
    };

    const runCycle = () => {
      breathingCycle().then(() => {
        if (isActive) runCycle();
      });
    };

    runCycle();

    return () => setIsActive(false);
  }, [isActive]);

  const getMessage = () => {
    switch (phase) {
      case "inhale": return "Breathe in slowly...";
      case "hold": return "Hold your breath...";
      case "exhale": return "Breathe out slowly...";
      case "rest": return "Ready? Let's breathe.";
    }
  };

  const getColor = () => {
    switch (phase) {
      case "inhale": return "from-cyan-400 to-blue-500";
      case "hold": return "from-blue-400 to-indigo-500";
      case "exhale": return "from-indigo-400 to-purple-500";
      case "rest": return "from-cyan-400 to-blue-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">Breathing Exercise</h1>
              <p className="text-sm text-[var(--muted)]">Follow the circle to calm down</p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-cyan-200 dark:border-cyan-900/40 text-center">
          <span className="text-[var(--muted)]">Completed cycles: </span>
          <span className="text-lg font-bold text-cyan-500">{cycles}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div
            className={`w-48 h-48 rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center shadow-2xl transition-all duration-100`}
            style={{ transform: `scale(${scale})` }}
          >
            <div className="w-32 h-32 rounded-full bg-white/30 flex items-center justify-center">
              <Wind className="w-12 h-12 text-white" />
            </div>
          </div>

          <p className="mt-8 text-2xl font-bold text-[var(--text)] text-center">
            {getMessage()}
          </p>

          <button
            onClick={() => setIsActive(!isActive)}
            className={`mt-8 px-8 py-4 rounded-2xl font-bold text-white flex items-center gap-3 transition-all ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-lg"
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-6 h-6" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Start Breathing
              </>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-cyan-100 dark:border-cyan-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Watch the circle grow and shrink. Breathe along with it!
          </p>
        </div>
      </div>
    </div>
  );
}

