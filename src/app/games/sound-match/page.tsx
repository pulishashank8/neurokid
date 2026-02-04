"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Music, Volume2 } from "lucide-react";

const sounds = [
  { id: "dog", emoji: "🐕", name: "Dog", sound: "Woof woof!" },
  { id: "cat", emoji: "🐱", name: "Cat", sound: "Meow!" },
  { id: "cow", emoji: "🐄", name: "Cow", sound: "Moo!" },
  { id: "bird", emoji: "🐦", name: "Bird", sound: "Tweet tweet!" },
  { id: "lion", emoji: "🦁", name: "Lion", sound: "Roar!" },
  { id: "frog", emoji: "🐸", name: "Frog", sound: "Ribbit!" },
];

export default function SoundMatchPage() {
  const [currentSound, setCurrentSound] = useState(0);
  const [shuffledSounds, setShuffledSounds] = useState(sounds);
  const [options, setOptions] = useState<typeof sounds>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateOptions = (correctId: string) => {
    const correct = sounds.find(s => s.id === correctId)!;
    const others = sounds.filter(s => s.id !== correctId);
    const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 2);
    return [correct, ...shuffledOthers].sort(() => Math.random() - 0.5);
  };

  const initializeGame = () => {
    const shuffled = [...sounds].sort(() => Math.random() - 0.5);
    setShuffledSounds(shuffled);
    setCurrentSound(0);
    setOptions(generateOptions(shuffled[0].id));
    setScore(0);
    setShowResult(null);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const playSound = () => {
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(shuffledSounds[currentSound].sound);
    utterance.rate = 0.8;
    utterance.onend = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const handleAnswer = (id: string) => {
    const isCorrect = id === shuffledSounds[currentSound].id;
    setShowResult(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      if (currentSound + 1 < shuffledSounds.length) {
        const nextIdx = currentSound + 1;
        setCurrentSound(nextIdx);
        setOptions(generateOptions(shuffledSounds[nextIdx].id));
      } else {
        setIsComplete(true);
      }
    }, 1200);
  };

  const current = shuffledSounds[currentSound];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Sound Match</h1>
                <p className="text-sm text-[var(--muted)]">Match sounds to animals</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-800/30 text-[var(--muted)] hover:text-indigo-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">correct</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {currentSound + 1} of {shuffledSounds.length}
            </span>
          </div>
        </div>

        {!isComplete ? (
          <>
            {/* Sound Display */}
            <div className="mb-6 p-8 rounded-xl bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-900/40 text-center">
              <p className="text-sm text-[var(--muted)] mb-4">Listen to the sound. Which animal makes it?</p>
              
              <button
                onClick={playSound}
                disabled={isPlaying}
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center shadow-lg mx-auto transition-all ${
                  isPlaying ? "animate-pulse scale-110" : "hover:scale-105"
                }`}
              >
                <Volume2 className={`w-10 h-10 text-white ${isPlaying ? "animate-bounce" : ""}`} />
              </button>
              
              <p className="mt-4 text-sm text-[var(--muted)]">
                {isPlaying ? "Playing..." : "Tap to hear the sound"}
              </p>
              
              {showResult && (
                <p className={`mt-4 text-lg font-medium ${
                  showResult === "correct" ? "text-green-600" : "text-red-500"
                }`}>
                  {showResult === "correct" 
                    ? `Yes! The ${current.name} says "${current.sound}"` 
                    : `That was a ${current.name}!`}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={showResult !== null}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    showResult && option.id === current.id
                      ? "bg-green-100 dark:bg-green-900/30 border-green-400"
                      : showResult && option.id !== current.id
                        ? "opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-200"
                        : "bg-white dark:bg-white/5 border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-400 hover:scale-105"
                  }`}
                >
                  <span className="text-4xl">{option.emoji}</span>
                  <span className="text-sm font-medium text-[var(--text)]">{option.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 border border-indigo-200 dark:border-indigo-800/40">
            <div className="text-4xl mb-3">🎵</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Sound expert!</h2>
            <p className="text-[var(--muted)] mb-4">You got {score} out of {shuffledSounds.length} correct!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-violet-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Listen carefully. Think about what animal makes this sound.
          </p>
        </div>
      </div>
    </div>
  );
}

