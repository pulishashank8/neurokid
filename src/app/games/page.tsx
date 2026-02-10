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
  Sparkles,
  Type,
  SortAsc,
  Wind,
  Pencil,
  Cat,
  Clock,
  User,
  MessageCircle,
  Paintbrush,
  Trees,
  LayoutDashboard,
  PartyPopper,
  Volume2,
  Music2,
  Music4,
  Mic,
  Car,
  Sword,
  Piano,
  Heart,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

const games = [
  {
    id: "calm-buddy",
    name: "Calm Buddy",
    description: "Learn about feelings and calm down!",
    icon: Heart,
    color: "from-sky-400 to-purple-500",
    bgColor: "bg-sky-50 dark:bg-slate-800",
    borderColor: "border-sky-200 dark:border-sky-700/50",
    skills: ["Emotions", "Calming"],
  },
  {
    id: "piano",
    name: "Piano",
    description: "Play beautiful piano music!",
    icon: Music,
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-slate-800",
    borderColor: "border-purple-200 dark:border-purple-700/50",
    skills: ["Music", "Creative"],
  },
  {
    id: "guitar",
    name: "Guitar",
    description: "Strum guitar strings and chords!",
    icon: Music2,
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-slate-800",
    borderColor: "border-amber-200 dark:border-amber-700/50",
    skills: ["Music", "Creative"],
  },
  {
    id: "drums",
    name: "Drum Kit",
    description: "Play drums and make beats!",
    icon: Music4,
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-50 dark:bg-slate-800",
    borderColor: "border-orange-200 dark:border-orange-700/50",
    skills: ["Music", "Rhythm"],
  },
  {
    id: "car-racing",
    name: "Car Racing",
    description: "Dodge cars and race to victory!",
    icon: Car,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-slate-800",
    borderColor: "border-blue-200 dark:border-blue-700/50",
    skills: ["Action", "Reflexes"],
  },
  {
    id: "fruit-ninja",
    name: "Fruit Ninja",
    description: "Slice fruits, avoid bombs!",
    icon: Sword,
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-50 dark:bg-slate-800",
    borderColor: "border-orange-200 dark:border-orange-700/50",
    skills: ["Action", "Coordination"],
  },
  {
    id: "silly-sounds",
    name: "Silly Sounds",
    description: "Make funny noises!",
    icon: Volume2,
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-slate-800",
    borderColor: "border-orange-200 dark:border-orange-700/50",
    skills: ["Fun", "Laughs"],
  },
  {
    id: "balloon-pop",
    name: "Balloon Pop",
    description: "Pop the balloons!",
    icon: PartyPopper,
    color: "from-sky-400 to-pink-500",
    bgColor: "bg-sky-50 dark:bg-slate-800",
    borderColor: "border-sky-200 dark:border-sky-700/50",
    skills: ["Fun", "Action"],
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Flip cards to find matching pairs",
    icon: Grid3X3,
    color: "from-pink-400 to-rose-400",
    bgColor: "bg-pink-50 dark:bg-slate-800",
    borderColor: "border-pink-200 dark:border-pink-700/50",
    skills: ["Memory", "Focus"],
  },
  {
    id: "color-sort",
    name: "Color Sort",
    description: "Sort items by their colors",
    icon: Palette,
    color: "from-violet-400 to-purple-400",
    bgColor: "bg-violet-50 dark:bg-slate-800",
    borderColor: "border-violet-200 dark:border-violet-700/50",
    skills: ["Categorization", "Colors"],
  },
  {
    id: "shape-puzzle",
    name: "Shape Puzzle",
    description: "Match shapes to their outlines",
    icon: Shapes,
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-50 dark:bg-slate-800",
    borderColor: "border-blue-200 dark:border-blue-700/50",
    skills: ["Spatial", "Shapes"],
  },
  {
    id: "pattern-complete",
    name: "Pattern Complete",
    description: "Finish the pattern sequence",
    icon: Puzzle,
    color: "from-emerald-400 to-teal-400",
    bgColor: "bg-emerald-50 dark:bg-slate-800",
    borderColor: "border-emerald-200 dark:border-emerald-700/50",
    skills: ["Logic", "Patterns"],
  },
  {
    id: "emotion-match",
    name: "Emotion Match",
    description: "Match faces to feelings",
    icon: Smile,
    color: "from-amber-400 to-orange-400",
    bgColor: "bg-amber-50 dark:bg-slate-800",
    borderColor: "border-amber-200 dark:border-amber-700/50",
    skills: ["Emotions", "Social"],
  },
  {
    id: "counting-stars",
    name: "Counting Stars",
    description: "Count objects and pick the number",
    icon: Star,
    color: "from-yellow-400 to-amber-400",
    bgColor: "bg-yellow-50 dark:bg-slate-800",
    borderColor: "border-yellow-200 dark:border-yellow-700/50",
    skills: ["Numbers", "Counting"],
  },
  {
    id: "sound-match",
    name: "Sound Match",
    description: "Match sounds to pictures",
    icon: Music,
    color: "from-indigo-400 to-violet-400",
    bgColor: "bg-indigo-50 dark:bg-slate-800",
    borderColor: "border-indigo-200 dark:border-indigo-700/50",
    skills: ["Listening", "Association"],
  },
  {
    id: "sequence-builder",
    name: "Sequence Builder",
    description: "Put steps in the right order",
    icon: ListOrdered,
    color: "from-teal-400 to-emerald-400",
    bgColor: "bg-teal-50 dark:bg-slate-800",
    borderColor: "border-teal-200 dark:border-teal-700/50",
    skills: ["Sequencing", "Logic"],
  },
  {
    id: "spot-difference",
    name: "Spot the Difference",
    description: "Find what's different",
    icon: Search,
    color: "from-rose-400 to-pink-400",
    bgColor: "bg-rose-50 dark:bg-slate-800",
    borderColor: "border-rose-200 dark:border-rose-700/50",
    skills: ["Attention", "Detail"],
  },
  {
    id: "calming-bubbles",
    name: "Calming Bubbles",
    description: "Pop bubbles to relax",
    icon: Circle,
    color: "from-sky-400 to-blue-400",
    bgColor: "bg-sky-50 dark:bg-slate-800",
    borderColor: "border-sky-200 dark:border-sky-700/50",
    skills: ["Calm", "Focus"],
  },
  {
    id: "alphabet-match",
    name: "Alphabet Match",
    description: "Match uppercase with lowercase",
    icon: Type,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-slate-800",
    borderColor: "border-blue-200 dark:border-blue-700/50",
    skills: ["Letters", "Reading"],
  },
  {
    id: "number-order",
    name: "Number Order",
    description: "Count from 1 to 6 in order",
    icon: SortAsc,
    color: "from-purple-400 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-slate-800",
    borderColor: "border-purple-200 dark:border-purple-700/50",
    skills: ["Numbers", "Sequencing"],
  },
  {
    id: "breathing-exercise",
    name: "Breathing Exercise",
    description: "Follow the circle to calm down",
    icon: Wind,
    color: "from-cyan-400 to-blue-500",
    bgColor: "bg-cyan-50 dark:bg-slate-800",
    borderColor: "border-cyan-200 dark:border-cyan-700/50",
    skills: ["Calm", "Mindfulness"],
  },
  {
    id: "tracing-letters",
    name: "Tracing Letters",
    description: "Follow the path to write letters",
    icon: Pencil,
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-slate-800",
    borderColor: "border-orange-200 dark:border-orange-700/50",
    skills: ["Writing", "Motor"],
  },
  {
    id: "animal-sounds",
    name: "Animal Sounds",
    description: "Which animal makes this sound?",
    icon: Cat,
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-slate-800",
    borderColor: "border-green-200 dark:border-green-700/50",
    skills: ["Animals", "Learning"],
  },
  {
    id: "telling-time",
    name: "Telling Time",
    description: "What time does the clock show?",
    icon: Clock,
    color: "from-cyan-400 to-sky-500",
    bgColor: "bg-cyan-50 dark:bg-slate-800",
    borderColor: "border-cyan-200 dark:border-cyan-700/50",
    skills: ["Time", "Numbers"],
  },
  {
    id: "body-parts",
    name: "Body Parts",
    description: "Learn about your body",
    icon: User,
    color: "from-rose-400 to-pink-500",
    bgColor: "bg-rose-50 dark:bg-slate-800",
    borderColor: "border-rose-200 dark:border-rose-700/50",
    skills: ["Body", "Learning"],
  },
  {
    id: "conversation-practice",
    name: "Conversation Practice",
    description: "Learn what to say",
    icon: MessageCircle,
    color: "from-indigo-400 to-purple-500",
    bgColor: "bg-indigo-50 dark:bg-slate-800",
    borderColor: "border-indigo-200 dark:border-indigo-700/50",
    skills: ["Social", "Communication"],
  },
  {
    id: "color-names",
    name: "Color Names",
    description: "What color is this?",
    icon: Paintbrush,
    color: "from-fuchsia-400 to-pink-500",
    bgColor: "bg-fuchsia-50 dark:bg-slate-800",
    borderColor: "border-fuchsia-200 dark:border-fuchsia-700/50",
    skills: ["Colors", "Words"],
  },
  {
    id: "zen-garden",
    name: "Zen Garden",
    description: "Draw in the sand to relax",
    icon: Trees,
    color: "from-amber-400 to-stone-500",
    bgColor: "bg-amber-50 dark:bg-slate-800",
    borderColor: "border-amber-200 dark:border-amber-700/50",
    skills: ["Calm", "Creative"],
  },
  {
    id: "sliding-puzzle",
    name: "Sliding Puzzle",
    description: "Slide tiles to solve",
    icon: LayoutDashboard,
    color: "from-teal-400 to-cyan-500",
    bgColor: "bg-teal-50 dark:bg-slate-800",
    borderColor: "border-teal-200 dark:border-teal-700/50",
    skills: ["Logic", "Problem Solving"],
  },
  {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    description: "Classic X and O game",
    icon: Grid3X3,
    color: "from-indigo-400 to-purple-500",
    bgColor: "bg-indigo-50 dark:bg-slate-800",
    borderColor: "border-indigo-200 dark:border-indigo-700/50",
    skills: ["Strategy", "Turn-taking"],
  },
  {
    id: "snake",
    name: "Snake Game",
    description: "Eat apples to grow!",
    icon: Gamepad2,
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-slate-800",
    borderColor: "border-green-200 dark:border-green-700/50",
    skills: ["Coordination", "Focus"],
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--surface)] to-[var(--background)] pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackPath="/dashboard" />
          </div>


          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Fun & Learn Games</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Simple, calming games designed for focus and fun</p>
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 border border-violet-100 dark:border-violet-700/50">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">Designed with care</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
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
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {game.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{game.description}</p>

              {/* Skill tags */}
              <div className="flex flex-wrap gap-1.5">
                {game.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-700/80 text-[10px] font-medium text-gray-600 dark:text-gray-200"
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All games are designed to be calming and supportive for neurodivergent children.
          </p>
        </div>
      </div>
    </div>
  );
}

