"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Heart, Wind, Waves, Sparkles } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const BREATHING_PATTERNS = {
  calm: {
    name: "Box Breathing",
    inhale: 4, hold: 4, exhale: 4, rest: 4,
    color: "emerald",
    icon: "square",
    description: "Equal 4-second intervals. Best for anxiety, panic, and regaining focus during overwhelming moments."
  },
  relaxed: {
    name: "Deep Relaxation",
    inhale: 4, hold: 7, exhale: 8, rest: 0,
    color: "blue",
    icon: "waves",
    description: "Long exhale activates your parasympathetic system. Best for calming down after a meltdown or stressful event."
  },
  energize: {
    name: "Wake Up Breath",
    inhale: 2, hold: 0, exhale: 2, rest: 0,
    color: "amber",
    icon: "sun",
    description: "Quick, rhythmic breathing increases alertness. Best for mornings or when feeling sluggish and unmotivated."
  },
  grounding: {
    name: "Grounding Breath",
    inhale: 5, hold: 2, exhale: 7, rest: 3,
    color: "purple",
    icon: "anchor",
    description: "Slow, extended pattern with long exhale and rest. Best for sensory overload, dissociation, or feeling disconnected."
  },
};

type PatternKey = keyof typeof BREATHING_PATTERNS;

export default function CalmClient() {
  const router = useRouter();
  const { status } = useSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [timer, setTimer] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<PatternKey>("calm");
  const [soundEnabled, setSoundEnabled] = useState(false);

  const pattern = BREATHING_PATTERNS[selectedPattern];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/calm");
    }
  }, [status, router]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        const newTimer = prev + 1;

        let currentPhaseDuration = 0;
        let nextPhase: BreathingPhase = phase;

        switch (phase) {
          case "inhale":
            currentPhaseDuration = pattern.inhale;
            nextPhase = pattern.hold > 0 ? "hold" : "exhale";
            break;
          case "hold":
            currentPhaseDuration = pattern.hold;
            nextPhase = "exhale";
            break;
          case "exhale":
            currentPhaseDuration = pattern.exhale;
            nextPhase = pattern.rest > 0 ? "rest" : "inhale";
            break;
          case "rest":
            currentPhaseDuration = pattern.rest;
            nextPhase = "inhale";
            break;
        }

        if (newTimer >= currentPhaseDuration) {
          setPhase(nextPhase);
          if (nextPhase === "inhale") {
            setCycleCount((c) => c + 1);
          }
          return 0;
        }
        return newTimer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, phase, pattern]);

  const handleReset = () => {
    setIsPlaying(false);
    setPhase("inhale");
    setTimer(0);
    setCycleCount(0);
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale": return "Breathe In";
      case "hold": return "Hold";
      case "exhale": return "Breathe Out";
      case "rest": return "Rest";
    }
  };

  const getCurrentDuration = () => {
    switch (phase) {
      case "inhale": return pattern.inhale;
      case "hold": return pattern.hold;
      case "exhale": return pattern.exhale;
      case "rest": return pattern.rest;
    }
  };

  const getProgress = () => {
    const duration = getCurrentDuration();
    return duration > 0 ? (timer / duration) * 100 : 0;
  };

  const getCircleScale = () => {
    if (!isPlaying) return 1;
    switch (phase) {
      case "inhale": return 1 + (timer / pattern.inhale) * 0.3;
      case "hold": return 1.3;
      case "exhale": return 1.3 - (timer / pattern.exhale) * 0.3;
      case "rest": return 1;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[var(--background)] via-[var(--surface)] to-[var(--background)] pt-24 overflow-hidden pb-safe">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallbackPath="/dashboard" />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-4">
            <Wind className="w-4 h-4" />
            Calm & Breathe
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-3">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Calm</span>
          </h1>
          <p className="text-[var(--muted)] max-w-md mx-auto">
            Take a moment to breathe. This tool helps during overwhelming moments.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-3xl mx-auto">
          {(Object.keys(BREATHING_PATTERNS) as PatternKey[]).map((key) => {
            const p = BREATHING_PATTERNS[key];
            const isSelected = selectedPattern === key;
            const colorClasses = {
              emerald: isSelected ? "border-emerald-500 bg-emerald-500/10" : "hover:border-emerald-500/50",
              blue: isSelected ? "border-blue-500 bg-blue-500/10" : "hover:border-blue-500/50",
              amber: isSelected ? "border-amber-500 bg-amber-500/10" : "hover:border-amber-500/50",
              purple: isSelected ? "border-purple-500 bg-purple-500/10" : "hover:border-purple-500/50",
            };
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedPattern(key);
                  handleReset();
                }}
                className={`p-4 rounded-xl text-left transition-all border-2 ${colorClasses[p.color as keyof typeof colorClasses]
                  } ${!isSelected ? "bg-[var(--surface)] border-[var(--border)]" : ""}`}
              >
                <div className="font-semibold text-[var(--text)] text-sm mb-1">{p.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {p.inhale}-{p.hold > 0 ? p.hold : "−"}-{p.exhale}{p.rest > 0 ? `-${p.rest}` : ""}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 mb-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-[var(--text)]">
            <span className="font-semibold">{pattern.name}:</span>{" "}
            <span className="text-[var(--muted)]">{pattern.description}</span>
          </p>
        </div>

        <div className="relative flex items-center justify-center mb-8" style={{ height: '320px' }}>
          <div
            className="absolute rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 transition-transform duration-1000 ease-in-out"
            style={{
              width: '280px',
              height: '280px',
              transform: `scale(${getCircleScale()})`,
            }}
          />
          <div
            className="absolute rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/30 transition-transform duration-1000 ease-in-out"
            style={{
              width: '220px',
              height: '220px',
              transform: `scale(${getCircleScale()})`,
            }}
          />
          <div
            className="relative rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out"
            style={{
              width: '180px',
              height: '180px',
              transform: `scale(${getCircleScale()})`,
            }}
          >
            <span className="text-white text-2xl font-bold">{getPhaseText()}</span>
            <span className="text-white/80 text-4xl font-bold mt-1">
              {getCurrentDuration() - timer}
            </span>
          </div>

          <svg className="absolute w-[300px] h-[300px] -rotate-90">
            <circle
              cx="150"
              cy="150"
              r="145"
              fill="none"
              stroke="var(--border)"
              strokeWidth="4"
            />
            <circle
              cx="150"
              cy="150"
              r="145"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 145}`}
              strokeDashoffset={`${2 * Math.PI * 145 * (1 - getProgress() / 100)}`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/30 hover:shadow-[var(--primary)]/50 hover:scale-105 transition-all flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-all flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center ${soundEnabled
                ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]"
              }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center mb-10">
          <p className="text-[var(--muted)]">
            Completed <span className="font-bold text-[var(--primary)]">{cycleCount}</span> breathing cycles
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 text-center shadow-premium">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-[var(--text)] mb-1">Reduces Stress</h3>
            <p className="text-sm text-[var(--muted)]">Deep breathing activates your body's relaxation response</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 text-center shadow-premium">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Waves className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-[var(--text)] mb-1">Calms the Mind</h3>
            <p className="text-sm text-[var(--muted)]">Focused breathing helps quiet racing thoughts</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 text-center shadow-premium">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-[var(--text)] mb-1">Regulates Emotions</h3>
            <p className="text-sm text-[var(--muted)]">Helps during sensory overload or meltdowns</p>
          </div>
        </div>

        <div className="mt-10 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/20 p-5 max-w-2xl mx-auto">
          <p className="text-sm text-amber-800 dark:text-amber-200/80 text-center">
            <strong>Tip:</strong> Use this tool when your child is feeling overwhelmed. Breathe together - children often mirror calm adults.
          </p>
        </div>
      </div>
    </div>
  );
}
