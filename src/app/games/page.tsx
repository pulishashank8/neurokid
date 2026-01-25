"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Gamepad2, 
  Puzzle, 
  Palette, 
  Shapes, 
  Grid3X3, 
  Smile, 
  Star, 
  Music, 
  ListOrdered, 
  Search,
  Circle,
  ArrowLeft,
  Sparkles
} from "lucide-react";

const games = [
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Flip cards to find matching pairs",
    icon: Grid3X3,
    color: "from-pink-400 to-rose-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-900/40",
    skills: ["Memory", "Focus"],
  },
  {
    id: "color-sort",
    name: "Color Sort",
    description: "Sort items by their colors",
    icon: Palette,
    color: "from-violet-400 to-purple-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-900/40",
    skills: ["Categorization", "Colors"],
  },
  {
    id: "shape-puzzle",
    name: "Shape Puzzle",
    description: "Match shapes to their outlines",
    icon: Shapes,
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/40",
    skills: ["Spatial", "Shapes"],
  },
  {
    id: "pattern-complete",
    name: "Pattern Complete",
    description: "Finish the pattern sequence",
    icon: Puzzle,
    color: "from-emerald-400 to-teal-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-900/40",
    skills: ["Logic", "Patterns"],
  },
  {
    id: "emotion-match",
    name: "Emotion Match",
    description: "Match faces to feelings",
    icon: Smile,
    color: "from-amber-400 to-orange-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900/40",
    skills: ["Emotions", "Social"],
  },
  {
    id: "counting-stars",
    name: "Counting Stars",
    description: "Count objects and pick the number",
    icon: Star,
    color: "from-yellow-400 to-amber-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900/40",
    skills: ["Numbers", "Counting"],
  },
  {
    id: "sound-match",
    name: "Sound Match",
    description: "Match sounds to pictures",
    icon: Music,
    color: "from-indigo-400 to-violet-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-900/40",
    skills: ["Listening", "Association"],
  },
  {
    id: "sequence-builder",
    name: "Sequence Builder",
    description: "Put steps in the right order",
    icon: ListOrdered,
    color: "from-teal-400 to-emerald-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-900/40",
    skills: ["Sequencing", "Logic"],
  },
  {
    id: "spot-difference",
    name: "Spot the Difference",
    description: "Find what's different",
    icon: Search,
    color: "from-rose-400 to-pink-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-900/40",
    skills: ["Attention", "Detail"],
  },
  {
    id: "calming-bubbles",
    name: "Calming Bubbles",
    description: "Pop bubbles to relax",
    icon: Circle,
    color: "from-sky-400 to-blue-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    borderColor: "border-sky-200 dark:border-sky-900/40",
    skills: ["Calm", "Focus"],
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--surface)] to-[var(--background)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Fun & Learn Games</h1>
              <p className="text-[var(--muted)] text-sm sm:text-base">Simple, calming games designed for focus and fun</p>
            </div>
          </div>
          
          {/* Info banner */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-100 dark:border-violet-900/40">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--text)] font-medium">Designed with care</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  No time limits, no competition. Just gentle fun at your own pace.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className={`group relative rounded-2xl p-5 ${game.bgColor} ${game.borderColor} border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              {/* Soft ambient glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${game.color} opacity-20 rounded-full blur-2xl`} />
              
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <game.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-[var(--text)] mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {game.name}
              </h3>
              <p className="text-sm text-[var(--muted)] mb-3">{game.description}</p>
              
              {/* Skill tags */}
              <div className="flex flex-wrap gap-1.5">
                {game.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-[10px] font-medium text-[var(--muted)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            All games are designed to be calming and supportive for neurodivergent children.
          </p>
        </div>
      </div>
    </div>
  );
}
