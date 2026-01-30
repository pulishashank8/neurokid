// AAC (Augmentative Alternative Communication) Type Definitions

export type AACCategory = "core" | "food" | "sensory" | "emergency" | "social" | "actions" | "custom";

export interface AACWord {
  id: string;
  label: string;
  symbol: string; // Emoji or image URL
  category: AACCategory;
  audioText?: string; // Custom pronunciation override
  isCore?: boolean; // Core vocabulary (always visible)
  predictions?: string[]; // Suggested next word IDs
  order?: number;
}

export interface AACCustomWord {
  id: string;
  userId: string;
  label: string;
  symbol: string;
  category: AACCategory;
  audioText?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AACSentenceWord {
  word: AACWord;
  spokenAt?: Date;
  isHighlighted?: boolean;
}

export interface AACState {
  // Current sentence being built
  sentence: AACSentenceWord[];

  // Selected category filter
  activeCategory: AACCategory | "all";

  // Speech settings
  speechConfig: {
    volume: number; // 0-1, default 1.0
    pitch: number; // 0-2, default 1.0
    rate: number; // 0.1-10, default 0.85 (slower for clarity)
    selectedVoiceURI: string | null;
  };

  // Display settings
  sensoryMode: "vibrant" | "muted";
  isFullscreen: boolean;
  gridColumns: number; // Responsive columns

  // Speech state
  isSpeaking: boolean;
  highlightedWordIndex: number;

  // Predictions
  predictions: AACWord[];

  // Custom vocabulary
  customWords: AACCustomWord[];
  isLoadingCustomWords: boolean;
}

export type AACAction =
  | { type: "ADD_WORD"; word: AACWord }
  | { type: "REMOVE_WORD"; index: number }
  | { type: "CLEAR_SENTENCE" }
  | { type: "SET_CATEGORY"; category: AACCategory | "all" }
  | { type: "SET_SPEECH_CONFIG"; config: Partial<AACState["speechConfig"]> }
  | { type: "TOGGLE_SENSORY_MODE" }
  | { type: "SET_FULLSCREEN"; value: boolean }
  | { type: "SET_SPEAKING"; value: boolean }
  | { type: "SET_HIGHLIGHTED_WORD"; index: number }
  | { type: "UPDATE_PREDICTIONS"; words: AACWord[] }
  | { type: "SET_CUSTOM_WORDS"; words: AACCustomWord[] }
  | { type: "ADD_CUSTOM_WORD"; word: AACCustomWord }
  | { type: "UPDATE_CUSTOM_WORD"; word: AACCustomWord }
  | { type: "DELETE_CUSTOM_WORD"; id: string }
  | { type: "SET_LOADING_CUSTOM_WORDS"; value: boolean }
  | { type: "SET_GRID_COLUMNS"; columns: number };

export interface AACCategoryInfo {
  id: AACCategory | "all";
  label: string;
  icon: string;
  color: string;
}

export interface SpeechSynthesisConfig {
  volume: number;
  pitch: number;
  rate: number;
}

export interface VoicePreference {
  name: string;
  lang: string;
  priority: number;
}

// API request/response types
export interface CreateAACWordRequest {
  label: string;
  symbol: string;
  category: AACCategory;
  audioText?: string;
  order?: number;
}

export interface UpdateAACWordRequest {
  label?: string;
  symbol?: string;
  category?: AACCategory;
  audioText?: string;
  order?: number;
  isActive?: boolean;
}

export interface AACWordResponse {
  id: string;
  userId: string;
  label: string;
  symbol: string;
  category: string;
  audioText: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
