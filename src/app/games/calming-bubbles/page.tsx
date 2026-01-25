"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Circle, Sparkles } from "lucide-react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

const colors = [
  "from-pink-300 to-pink-400",
  "from-violet-300 to-violet-400",
  "from-blue-300 to-blue-400",
  "from-teal-300 to-teal-400",
  "from-amber-300 to-amber-400",
  "from-rose-300 to-rose-400",
  "from-indigo-300 to-indigo-400",
  "from-emerald-300 to-emerald-400",
];

export default function CalmingBubblesPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setPopped(p => p + 1);
  };

  const resetGame = () => {
    setBubbles([]);
    setPopped(0);
  };

  useEffect(() => {
    const addBubbleInterval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length < 12) {
          const size = Math.random() * 40 + 30;
          return [...prev, {
            id: Date.now() + Math.random(),
            x: Math.random() * 80 + 10,
            y: 110,
            size,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 0.5 + 0.3,
          }];
        }
        return prev;
      });
    }, 800);

    const moveInterval = setInterval(() => {
      setBubbles(prev => 
        prev
          .map(b => ({ ...b, y: b.y - b.speed }))
          .filter(b => b.y > -20)
      );
    }, 50);

    return () => {
      clearInterval(addBubbleInterval);
      clearInterval(moveInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 py-8 px-4 overflow-hidden">
      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="mb-6 relative z-10">
          <Link 
            href="/games" 
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-400 flex items-center justify-center shadow-lg">
                <Circle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Calming Bubbles</h1>
                <p className="text-sm text-[var(--muted)]">Pop bubbles to relax</p>
              </div>
            </div>
            
            <button
              onClick={resetGame}
              className="p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-sky-200 dark:border-sky-800/30 text-[var(--muted)] hover:text-sky-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-sky-200 dark:border-sky-900/40 backdrop-blur-sm relative z-10">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{popped}</span>
            <span className="text-[var(--muted)]">bubbles popped</span>
          </div>
        </div>

        {/* Bubble area */}
        <div className="relative h-[400px] rounded-2xl bg-gradient-to-b from-sky-200/50 to-blue-300/50 dark:from-sky-900/20 dark:to-blue-900/30 border border-sky-200 dark:border-sky-800/40 overflow-hidden">
          {/* Water effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-300/60 to-transparent dark:from-blue-600/30" />
          
          {bubbles.map((bubble) => (
            <button
              key={bubble.id}
              onClick={() => popBubble(bubble.id)}
              aria-label="Pop bubble"
              style={{
                position: "absolute",
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                transform: "translate(-50%, -50%)",
                animationDuration: "2s",
              }}
              className={`rounded-full bg-gradient-to-br ${bubble.color} opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-200 shadow-lg border-2 border-white/40 animate-pulse`}
            >
              <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60" />
            </button>
          ))}
          
          {bubbles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--muted)] text-center px-4">
                Bubbles are coming...<br />
                <span className="text-sm">Tap them gently to pop!</span>
              </p>
            </div>
          )}
        </div>

        {/* Calming message */}
        <div className="mt-6 p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-sky-100 dark:border-sky-900/30 backdrop-blur-sm">
          <p className="text-sm text-[var(--muted)] text-center">
            Take your time. Breathe slowly. Pop bubbles at your own pace.
          </p>
        </div>
        
        {/* Affirmations */}
        <div className="mt-4 text-center">
          <p className="text-sm text-sky-600 dark:text-sky-400 font-medium">
            {popped > 0 && popped % 10 === 0 
              ? "You're doing great! Keep going!" 
              : popped > 0 && popped % 5 === 0 
                ? "Nice and calm..." 
                : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
