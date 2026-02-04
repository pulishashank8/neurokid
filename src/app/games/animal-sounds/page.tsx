"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Cat, Volume2 } from "lucide-react";

const animals = [
  { name: "Dog", emoji: "🐕", sound: "Woof!" },
  { name: "Cat", emoji: "🐱", sound: "Meow!" },
  { name: "Cow", emoji: "🐄", sound: "Moo!" },
  { name: "Duck", emoji: "🦆", sound: "Quack!" },
  { name: "Pig", emoji: "🐷", sound: "Oink!" },
  { name: "Sheep", emoji: "🐑", sound: "Baa!" },
];

export default function AnimalSoundsPage() {
  const [currentAnimal, setCurrentAnimal] = useState(0);
  const [options, setOptions] = useState<typeof animals>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const setupRound = () => {
    const shuffled = [...animals].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const wrongOptions = shuffled.slice(1, 3);
    const allOptions = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentAnimal(animals.findIndex(a => a.name === correct.name));
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

    if (name === animals[currentAnimal].name) {
      setScore(s => s + 1);
    }
  };

  const nextRound = () => {
    setupRound();
  };

  const playSound = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(animals[currentAnimal].sound);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <Cat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Animal Sounds</h1>
                <p className="text-sm text-[var(--muted)]">Which animal makes this sound?</p>
              </div>
            </div>

            <button
              onClick={setupRound}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-green-200 dark:border-green-800/30 text-[var(--muted)] hover:text-green-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-green-200 dark:border-green-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">Score: {score}</span>
          </div>
        </div>

        <div className="mb-6 p-8 rounded-2xl bg-white dark:bg-white/5 border border-green-200 dark:border-green-900/40 text-center">
          <button
            onClick={playSound}
            className="mb-4 p-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white hover:scale-105 transition-transform"
          >
            <Volume2 className="w-8 h-8" />
          </button>
          <p className="text-3xl font-bold text-[var(--text)]">"{animals[currentAnimal].sound}"</p>
          <p className="text-[var(--muted)] mt-2">Tap the speaker to hear it!</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {options.map((animal) => (
            <button
              key={animal.name}
              onClick={() => handleSelect(animal.name)}
              disabled={showResult}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                showResult
                  ? animal.name === animals[currentAnimal].name
                    ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                    : selected === animal.name
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                      : "bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-gray-800"
                  : "bg-white dark:bg-white/10 border-2 border-green-200 dark:border-green-800/30 hover:border-green-400 hover:scale-105"
              }`}
            >
              <span className="text-5xl">{animal.emoji}</span>
              <span className="font-bold text-[var(--text)]">{animal.name}</span>
            </button>
          ))}
        </div>

        {showResult && (
          <div className="text-center">
            <p className="text-xl font-bold mb-4 text-[var(--text)]">
              {selected === animals[currentAnimal].name ? "🎉 Correct!" : "Try again!"}
            </p>
            <button
              onClick={nextRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Next Animal
            </button>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-green-100 dark:border-green-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Listen to the sound and pick the animal that makes it!
          </p>
        </div>
      </div>
    </div>
  );
}

