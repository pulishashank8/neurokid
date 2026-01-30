// AAC Default Vocabulary - Core + Fringe Words
// Based on SLP (Speech-Language Pathology) best practices

import { AACWord, AACCategory, AACCategoryInfo } from "@/lib/types/aac";

// Category definitions with styling
export const AAC_CATEGORIES: AACCategoryInfo[] = [
  { id: "all", label: "All", icon: "🏠", color: "from-gray-500 to-slate-500" },
  { id: "core", label: "Core", icon: "⭐", color: "from-amber-500 to-yellow-500" },
  { id: "food", label: "Food", icon: "🍽️", color: "from-orange-500 to-red-400" },
  { id: "sensory", label: "Sensory", icon: "👂", color: "from-purple-500 to-violet-500" },
  { id: "emergency", label: "Emergency", icon: "🚨", color: "from-red-600 to-rose-500" },
  { id: "social", label: "Social", icon: "👋", color: "from-blue-500 to-cyan-500" },
  { id: "actions", label: "Actions", icon: "⚡", color: "from-green-500 to-emerald-500" },
];

// Default vocabulary - Core words (high-frequency, always useful)
export const CORE_VOCABULARY: AACWord[] = [
  {
    id: "i",
    label: "I",
    symbol: "👆",
    category: "core",
    isCore: true,
    predictions: ["want", "need", "feel", "like"],
  },
  {
    id: "want",
    label: "Want",
    symbol: "🙏",
    category: "core",
    isCore: true,
    predictions: ["pizza", "water", "hug", "play"],
  },
  {
    id: "need",
    label: "Need",
    symbol: "❗",
    category: "core",
    isCore: true,
    predictions: ["help", "bathroom", "break", "quiet"],
  },
  {
    id: "stop",
    label: "Stop",
    symbol: "✋",
    category: "core",
    isCore: true,
    audioText: "stop",
  },
  {
    id: "help",
    label: "Help",
    symbol: "🆘",
    category: "core",
    isCore: true,
    predictions: ["please", "now", "me"],
  },
  {
    id: "yes",
    label: "Yes",
    symbol: "✅",
    category: "core",
    isCore: true,
  },
  {
    id: "no",
    label: "No",
    symbol: "❌",
    category: "core",
    isCore: true,
    audioText: "no",
  },
  {
    id: "more",
    label: "More",
    symbol: "➕",
    category: "core",
    isCore: true,
    predictions: ["please", "food", "play"],
  },
  {
    id: "please",
    label: "Please",
    symbol: "🙂",
    category: "core",
    isCore: true,
  },
  {
    id: "thank-you",
    label: "Thank You",
    symbol: "🙏",
    category: "core",
    isCore: true,
    audioText: "thank you",
  },
  {
    id: "go",
    label: "Go",
    symbol: "🚶",
    category: "core",
    isCore: true,
    predictions: ["home", "bathroom", "outside"],
  },
  {
    id: "all-done",
    label: "All Done",
    symbol: "🏁",
    category: "core",
    isCore: true,
    audioText: "all done",
  },
  {
    id: "like",
    label: "Like",
    symbol: "👍",
    category: "core",
    isCore: true,
    predictions: ["it", "this", "that"],
  },
  {
    id: "toy",
    label: "Toy",
    symbol: "🧸",
    category: "core",
    isCore: true,
  },
  {
    id: "tablet",
    label: "Tablet",
    symbol: "📱",
    category: "core",
    isCore: true,
  },
  {
    id: "home",
    label: "Home",
    symbol: "🏠",
    category: "core",
    isCore: true,
  },
  {
    id: "school",
    label: "School",
    symbol: "🏫",
    category: "core",
    isCore: true,
  },
  {
    id: "park",
    label: "Park",
    symbol: "🛝",
    category: "core",
    isCore: true,
  },
];

// Food vocabulary
export const FOOD_VOCABULARY: AACWord[] = [
  {
    id: "pizza",
    label: "Pizza",
    symbol: "🍕",
    category: "food",
    predictions: ["please", "more"],
  },
  {
    id: "milkshake",
    label: "Milkshake",
    symbol: "🥤",
    category: "food",
  },
  {
    id: "chicken-nuggets",
    label: "Chicken Nuggets",
    symbol: "🍗",
    category: "food",
    audioText: "chicken nuggets",
  },
  {
    id: "water",
    label: "Water",
    symbol: "💧",
    category: "food",
    predictions: ["please", "more"],
  },
  {
    id: "juice",
    label: "Juice",
    symbol: "🧃",
    category: "food",
  },
  {
    id: "snack",
    label: "Snack",
    symbol: "🍪",
    category: "food",
  },
  {
    id: "fruit",
    label: "Fruit",
    symbol: "🍎",
    category: "food",
  },
  {
    id: "sandwich",
    label: "Sandwich",
    symbol: "🥪",
    category: "food",
  },
  {
    id: "chips",
    label: "Chips",
    symbol: "🍟",
    category: "food",
  },
  {
    id: "ice-cream",
    label: "Ice Cream",
    symbol: "🍦",
    category: "food",
    audioText: "ice cream",
  },
  {
    id: "hungry",
    label: "Hungry",
    symbol: "🤤",
    category: "food",
    predictions: ["want", "food"],
  },
  {
    id: "thirsty",
    label: "Thirsty",
    symbol: "😋",
    category: "food",
    predictions: ["want", "water", "juice"],
  },
  {
    id: "bread",
    label: "Bread",
    symbol: "🍞",
    category: "food",
  },
  {
    id: "apple",
    label: "Apple",
    symbol: "🍎",
    category: "food",
  },
  {
    id: "banana",
    label: "Banana",
    symbol: "🍌",
    category: "food",
  },
  {
    id: "cookie",
    label: "Cookie",
    symbol: "🍪",
    category: "food",
    audioText: "cookie",
  },
];

// Sensory vocabulary
export const SENSORY_VOCABULARY: AACWord[] = [
  {
    id: "too-loud",
    label: "Too Loud",
    symbol: "🔊",
    category: "sensory",
    audioText: "too loud",
  },
  {
    id: "too-bright",
    label: "Too Bright",
    symbol: "☀️",
    category: "sensory",
    audioText: "too bright",
  },
  {
    id: "headphones",
    label: "Headphones",
    symbol: "🎧",
    category: "sensory",
    predictions: ["please", "need"],
  },
  {
    id: "hug",
    label: "Hug",
    symbol: "🤗",
    category: "sensory",
    predictions: ["please", "want"],
  },
  {
    id: "space",
    label: "Space",
    symbol: "↔️",
    category: "sensory",
    audioText: "I need space",
  },
  {
    id: "quiet",
    label: "Quiet",
    symbol: "🤫",
    category: "sensory",
    predictions: ["please"],
  },
  {
    id: "break",
    label: "Break",
    symbol: "⏸️",
    category: "sensory",
    predictions: ["need", "please"],
  },
  {
    id: "squeeze",
    label: "Squeeze",
    symbol: "💪",
    category: "sensory",
    audioText: "squeeze please",
  },
  {
    id: "cold",
    label: "Cold",
    symbol: "🥶",
    category: "sensory",
  },
  {
    id: "hot",
    label: "Hot",
    symbol: "🥵",
    category: "sensory",
  },
  {
    id: "comfortable",
    label: "Comfortable",
    symbol: "😌",
    category: "sensory",
  },
  {
    id: "uncomfortable",
    label: "Uncomfortable",
    symbol: "😣",
    category: "sensory",
  },
  {
    id: "tired",
    label: "Tired",
    symbol: "🥱",
    category: "sensory",
    audioText: "I am tired",
  },
  {
    id: "mad",
    label: "Mad",
    symbol: "😡",
    category: "sensory",
    audioText: "I am mad",
  },
];

// Emergency vocabulary
export const EMERGENCY_VOCABULARY: AACWord[] = [
  {
    id: "hurt",
    label: "Hurt",
    symbol: "🤕",
    category: "emergency",
    audioText: "I am hurt",
    predictions: ["help"],
  },
  {
    id: "sick",
    label: "Sick",
    symbol: "🤢",
    category: "emergency",
    audioText: "I feel sick",
    predictions: ["help"],
  },
  {
    id: "bathroom",
    label: "Bathroom",
    symbol: "🚽",
    category: "emergency",
    predictions: ["need", "now"],
  },
  {
    id: "call-mom",
    label: "Call Mom",
    symbol: "📱👩",
    category: "emergency",
    audioText: "please call mom",
  },
  {
    id: "call-dad",
    label: "Call Dad",
    symbol: "📱👨",
    category: "emergency",
    audioText: "please call dad",
  },
  {
    id: "scared",
    label: "Scared",
    symbol: "😨",
    category: "emergency",
    audioText: "I am scared",
  },
  {
    id: "lost",
    label: "Lost",
    symbol: "❓",
    category: "emergency",
    audioText: "I am lost",
  },
  {
    id: "medicine",
    label: "Medicine",
    symbol: "💊",
    category: "emergency",
  },
];

// Social vocabulary
export const SOCIAL_VOCABULARY: AACWord[] = [
  {
    id: "hello",
    label: "Hello",
    symbol: "👋",
    category: "social",
  },
  {
    id: "goodbye",
    label: "Goodbye",
    symbol: "👋",
    category: "social",
    audioText: "goodbye",
  },
  {
    id: "friend",
    label: "Friend",
    symbol: "🧑‍🤝‍🧑",
    category: "social",
  },
  {
    id: "play",
    label: "Play",
    symbol: "🎮",
    category: "social",
    predictions: ["want", "please"],
  },
  {
    id: "happy",
    label: "Happy",
    symbol: "😊",
    category: "social",
    audioText: "I am happy",
  },
  {
    id: "sad",
    label: "Sad",
    symbol: "😢",
    category: "social",
    audioText: "I am sad",
  },
  {
    id: "angry",
    label: "Angry",
    symbol: "😠",
    category: "social",
    audioText: "I am angry",
  },
  {
    id: "love",
    label: "Love",
    symbol: "❤️",
    category: "social",
    audioText: "I love you",
  },
  {
    id: "sorry",
    label: "Sorry",
    symbol: "😔",
    category: "social",
    audioText: "I am sorry",
  },
  {
    id: "my-turn",
    label: "My Turn",
    symbol: "🙋",
    category: "social",
    audioText: "my turn",
  },
  {
    id: "your-turn",
    label: "Your Turn",
    symbol: "👉",
    category: "social",
    audioText: "your turn",
  },
];

// Actions vocabulary
export const ACTIONS_VOCABULARY: AACWord[] = [
  {
    id: "eat",
    label: "Eat",
    symbol: "🍴",
    category: "actions",
    predictions: ["food", "snack"],
  },
  {
    id: "drink",
    label: "Drink",
    symbol: "🥤",
    category: "actions",
    predictions: ["water", "juice"],
  },
  {
    id: "sleep",
    label: "Sleep",
    symbol: "😴",
    category: "actions",
    predictions: ["tired"],
  },
  {
    id: "read",
    label: "Read",
    symbol: "📖",
    category: "actions",
  },
  {
    id: "watch",
    label: "Watch",
    symbol: "📺",
    category: "actions",
    predictions: ["want"],
  },
  {
    id: "listen",
    label: "Listen",
    symbol: "👂",
    category: "actions",
  },
  {
    id: "walk",
    label: "Walk",
    symbol: "🚶",
    category: "actions",
  },
  {
    id: "sit",
    label: "Sit",
    symbol: "🪑",
    category: "actions",
  },
  {
    id: "wait",
    label: "Wait",
    symbol: "⏳",
    category: "actions",
  },
  {
    id: "open",
    label: "Open",
    symbol: "📂",
    category: "actions",
  },
  {
    id: "close",
    label: "Close",
    symbol: "📁",
    category: "actions",
  },
];

// Combined default vocabulary
export const DEFAULT_VOCABULARY: AACWord[] = [
  ...CORE_VOCABULARY,
  ...FOOD_VOCABULARY,
  ...SENSORY_VOCABULARY,
  ...EMERGENCY_VOCABULARY,
  ...SOCIAL_VOCABULARY,
  ...ACTIONS_VOCABULARY,
];

// Get vocabulary by category
export function getVocabularyByCategory(category: AACCategory | "all"): AACWord[] {
  if (category === "all") {
    return DEFAULT_VOCABULARY;
  }
  return DEFAULT_VOCABULARY.filter((word) => word.category === category);
}

// Get a word by ID
export function getWordById(id: string): AACWord | undefined {
  return DEFAULT_VOCABULARY.find((word) => word.id === id);
}

// Get core vocabulary only
export function getCoreVocabulary(): AACWord[] {
  return DEFAULT_VOCABULARY.filter((word) => word.isCore);
}
