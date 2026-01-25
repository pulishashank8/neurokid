"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Star, Grid3X3 } from "lucide-react";

const emojis = ["🌈", "🌸", "🦋", "🌻", "🐢", "🌙", "⭐", "🍀"];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatchPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const initializeGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMatches(0);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardClick = (id: number) => {
    if (isChecking) return;
    if (flippedCards.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatches(m => m + 1);
          setIsChecking(false);
          
          if (matches + 1 === emojis.length) {
            setIsComplete(true);
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 py-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Memory Match</h1>
                <p className="text-sm text-[var(--muted)]">Find all the matching pairs</p>
              </div>
            </div>
            
            <button
              onClick={initializeGame}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-pink-200 dark:border-pink-800/30 text-[var(--muted)] hover:text-pink-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-pink-200 dark:border-pink-900/40">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-[var(--text)]">{matches}</span>
            <span className="text-[var(--muted)]">of {emojis.length} pairs found</span>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || isChecking}
              className={`aspect-square rounded-xl text-4xl flex items-center justify-center transition-all duration-300 transform ${
                card.isFlipped || card.isMatched
                  ? "bg-white dark:bg-white/10 border-2 border-pink-300 dark:border-pink-700 scale-100"
                  : "bg-gradient-to-br from-pink-400 to-rose-400 cursor-pointer hover:scale-105 active:scale-95"
              } ${card.isMatched ? "opacity-60" : ""}`}
            >
              {(card.isFlipped || card.isMatched) ? card.emoji : ""}
            </button>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 border border-pink-200 dark:border-pink-800/40">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Amazing job!</h2>
            <p className="text-[var(--muted)] mb-4">You found all the matches!</p>
            <button
              onClick={initializeGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-pink-100 dark:border-pink-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Take your time. Try to remember where you saw each picture!
          </p>
        </div>
      </div>
    </div>
  );
}
