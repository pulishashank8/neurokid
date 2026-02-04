"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Star, Shapes } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

const shapes = [
  { id: "circle", name: "Circle", emoji: "🔴", outline: "○" },
  { id: "square", name: "Square", emoji: "🟦", outline: "□" },
  { id: "triangle", name: "Triangle", emoji: "🔺", outline: "△" },
  { id: "star", name: "Star", emoji: "⭐", outline: "☆" },
  { id: "heart", name: "Heart", emoji: "❤️", outline: "♡" },
  { id: "diamond", name: "Diamond", emoji: "💎", outline: "◇" },
];

export default function ShapePuzzlePage() {
  const [shuffledShapes, setShuffledShapes] = useState(shapes);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    setShuffledShapes([...shapes].sort(() => Math.random() - 0.5));
    setSelectedShape(null);
    setMatched([]);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleShapeClick = (id: string) => {
    if (matched.includes(id)) return;
    setSelectedShape(selectedShape === id ? null : id);
  };

  const handleOutlineClick = (id: string) => {
    if (!selectedShape || matched.includes(id)) return;
    
    if (selectedShape === id) {
      const newMatched = [...matched, id];
      setMatched(newMatched);
      setSelectedShape(null);
      
      if (newMatched.length === shapes.length) {
        setIsComplete(true);
      }
    } else {
      setSelectedShape(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <BackButton fallbackPath="/games" label="Back" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
                <Shapes className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Shape Puzzle</h1>
                <p className="text-sm text-[var(--muted)]">Match shapes to their outlines</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-blue-200 dark:border-blue-800/30 text-[var(--muted)] hover:text-blue-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-blue-200 dark:border-blue-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{matched.length}</span>
            <span className="text-[var(--muted)]">of {shapes.length} matched</span>
          </div>
        </div>

        {/* Shapes */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-blue-200 dark:border-blue-900/40">
          <p className="text-sm text-[var(--muted)] mb-3 text-center">Tap a shape, then tap its outline</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {shuffledShapes.filter(s => !matched.includes(s.id)).map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleShapeClick(shape.id)}
                className={`w-16 h-16 rounded-xl text-4xl flex items-center justify-center transition-all ${
                  selectedShape === shape.id
                    ? "bg-blue-200 dark:bg-blue-800 scale-110 ring-2 ring-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 hover:scale-105"
                }`}
              >
                {shape.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Outlines */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleOutlineClick(shape.id)}
              disabled={matched.includes(shape.id) || !selectedShape}
              className={`aspect-square rounded-xl text-5xl flex items-center justify-center border-2 border-dashed transition-all ${
                matched.includes(shape.id)
                  ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400"
                  : selectedShape
                    ? "bg-white dark:bg-white/5 border-blue-300 hover:border-blue-500 cursor-pointer hover:scale-105"
                    : "bg-gray-50 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700"
              }`}
            >
              {matched.includes(shape.id) ? shape.emoji : shape.outline}
            </button>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800/40">
            <div className="text-4xl mb-3">🎨</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">All shapes matched!</h2>
            <p className="text-[var(--muted)] mb-4">You're a shape expert!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look at the outline shape. Which colored shape looks the same?
          </p>
        </div>
      </div>
    </div>
  );
}

