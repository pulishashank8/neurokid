"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Smile } from "lucide-react";

const emotions = [
  { face: "😊", name: "Happy", color: "from-yellow-400 to-amber-400" },
  { face: "😢", name: "Sad", color: "from-blue-400 to-indigo-400" },
  { face: "😠", name: "Angry", color: "from-red-400 to-rose-400" },
  { face: "😨", name: "Scared", color: "from-purple-400 to-violet-400" },
  { face: "😲", name: "Surprised", color: "from-orange-400 to-amber-400" },
  { face: "😴", name: "Tired", color: "from-gray-400 to-slate-400" },
];

export default function EmotionMatchPage() {
  const [currentEmotion, setCurrentEmotion] = useState(0);
  const [shuffledEmotions, setShuffledEmotions] = useState(emotions);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const generateOptions = (correctAnswer: string) => {
    const otherEmotions = emotions.filter(e => e.name !== correctAnswer);
    const shuffled = otherEmotions.sort(() => Math.random() - 0.5).slice(0, 2);
    const allOptions = [correctAnswer, ...shuffled.map(e => e.name)];
    return allOptions.sort(() => Math.random() - 0.5);
  };

  const initializeGame = () => {
    const shuffled = [...emotions].sort(() => Math.random() - 0.5);
    setShuffledEmotions(shuffled);
    setCurrentEmotion(0);
    setOptions(generateOptions(shuffled[0].name));
    setScore(0);
    setShowResult(null);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === shuffledEmotions[currentEmotion].name;
    setShowResult(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      if (currentEmotion + 1 < shuffledEmotions.length) {
        const nextIdx = currentEmotion + 1;
        setCurrentEmotion(nextIdx);
        setOptions(generateOptions(shuffledEmotions[nextIdx].name));
      } else {
        setIsComplete(true);
      }
    }, 1200);
  };

  const emotion = shuffledEmotions[currentEmotion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 py-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Emotion Match</h1>
                <p className="text-sm text-[var(--muted)]">Match faces to feelings</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-amber-200 dark:border-amber-800/30 text-[var(--muted)] hover:text-amber-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-[var(--text)]">{score}</span>
              <span className="text-[var(--muted)]">correct</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {currentEmotion + 1} of {shuffledEmotions.length}
            </span>
          </div>
        </div>

        {!isComplete ? (
          <>
            {/* Face Display */}
            <div className="mb-6 p-8 rounded-xl bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-900/40 text-center">
              <p className="text-sm text-[var(--muted)] mb-4">How does this face feel?</p>
              <div className={`inline-flex w-32 h-32 rounded-full bg-gradient-to-br ${emotion.color} items-center justify-center shadow-lg`}>
                <span className="text-7xl">{emotion.face}</span>
              </div>
              {showResult && (
                <p className={`mt-4 text-lg font-medium ${
                  showResult === "correct" ? "text-green-600" : "text-red-500"
                }`}>
                  {showResult === "correct" ? `Yes! That's ${emotion.name}!` : `That's actually ${emotion.name}`}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult !== null}
                  className={`p-4 rounded-xl border text-lg font-medium transition-all ${
                    showResult && option === emotion.name
                      ? "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-300"
                      : showResult && option !== emotion.name
                        ? "opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        : "bg-white dark:bg-white/5 border-amber-200 dark:border-amber-900/40 hover:border-amber-400 hover:scale-[1.02]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Completion Message */
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800/40">
            <div className="text-4xl mb-3">🌟</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Great job with emotions!</h2>
            <p className="text-[var(--muted)] mb-4">You got {score} out of {shuffledEmotions.length} correct!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-amber-100 dark:border-amber-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Look at the face carefully. The eyes and mouth show how someone feels.
          </p>
        </div>
      </div>
    </div>
  );
}
