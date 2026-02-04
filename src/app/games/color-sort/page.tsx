"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Star, Palette, Check } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

const colors = [
  { name: "Red", bg: "bg-red-400", border: "border-red-500", items: ["🍎", "🍓", "🌹"] },
  { name: "Blue", bg: "bg-blue-400", border: "border-blue-500", items: ["🫐", "🐋", "💎"] },
  { name: "Yellow", bg: "bg-yellow-400", border: "border-yellow-500", items: ["🌻", "⭐", "🍋"] },
  { name: "Green", bg: "bg-green-400", border: "border-green-500", items: ["🥒", "🍀", "🐸"] },
];

interface DraggableItem {
  id: string;
  emoji: string;
  color: string;
  sorted: boolean;
}

export default function ColorSortPage() {
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [bins, setBins] = useState<{ [key: string]: string[] }>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    const allItems: DraggableItem[] = [];
    colors.forEach((color) => {
      color.items.forEach((emoji, idx) => {
        allItems.push({
          id: `${color.name}-${idx}`,
          emoji,
          color: color.name,
          sorted: false,
        });
      });
    });
    setItems(allItems.sort(() => Math.random() - 0.5));
    setBins({ Red: [], Blue: [], Yellow: [], Green: [] });
    setSelectedItem(null);
    setScore(0);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleItemClick = (id: string) => {
    if (items.find(i => i.id === id)?.sorted) return;
    setSelectedItem(selectedItem === id ? null : id);
  };

  const handleBinClick = (colorName: string) => {
    if (!selectedItem) return;
    
    const item = items.find(i => i.id === selectedItem);
    if (!item) return;

    if (item.color === colorName) {
      setItems(items.map(i => i.id === selectedItem ? { ...i, sorted: true } : i));
      setBins({ ...bins, [colorName]: [...bins[colorName], item.emoji] });
      setScore(s => s + 1);
      setSelectedItem(null);
      
      const totalItems = colors.reduce((acc, c) => acc + c.items.length, 0);
      if (score + 1 === totalItems) {
        setIsComplete(true);
      }
    } else {
      setSelectedItem(null);
    }
  };

  const totalItems = colors.reduce((acc, c) => acc + c.items.length, 0);
  const unsortedItems = items.filter(i => !i.sorted);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <BackButton fallbackPath="/games" label="Back" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center shadow-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Color Sort</h1>
                <p className="text-sm text-[var(--muted)]">Sort items by their color</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-violet-200 dark:border-violet-800/30 text-[var(--muted)] hover:text-violet-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-violet-200 dark:border-violet-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{score}</span>
            <span className="text-[var(--muted)]">of {totalItems} sorted</span>
          </div>
        </div>

        {/* Items to sort */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-violet-200 dark:border-violet-900/40">
          <p className="text-sm text-[var(--muted)] mb-3 text-center">Tap an item, then tap its color bin</p>
          <div className="flex flex-wrap gap-3 justify-center min-h-[60px]">
            {unsortedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center transition-all ${
                  selectedItem === item.id
                    ? "bg-violet-200 dark:bg-violet-800 scale-110 ring-2 ring-violet-400"
                    : "bg-gray-100 dark:bg-gray-800 hover:scale-105"
                }`}
              >
                {item.emoji}
              </button>
            ))}
            {unsortedItems.length === 0 && !isComplete && (
              <p className="text-[var(--muted)]">All sorted!</p>
            )}
          </div>
        </div>

        {/* Color bins */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleBinClick(color.name)}
              disabled={!selectedItem}
              className={`p-4 rounded-xl ${color.bg} ${color.border} border-2 transition-all ${
                selectedItem ? "hover:scale-105 cursor-pointer" : "opacity-80"
              }`}
            >
              <div className="text-white font-bold text-center mb-2">{color.name}</div>
              <div className="flex flex-wrap gap-1 justify-center min-h-[40px]">
                {bins[color.name]?.map((emoji, idx) => (
                  <span key={idx} className="text-2xl">{emoji}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800/40">
            <div className="text-4xl mb-3">🌈</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Perfect sorting!</h2>
            <p className="text-[var(--muted)] mb-4">You sorted all the colors!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-purple-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-violet-100 dark:border-violet-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look at each item carefully. What color does it remind you of?
          </p>
        </div>
      </div>
    </div>
  );
}

