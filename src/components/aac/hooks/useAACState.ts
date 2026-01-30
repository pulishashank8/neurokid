"use client";

import { useReducer, useCallback, useEffect } from "react";
import { AACState, AACAction, AACWord, AACCustomWord, AACCategory } from "@/lib/types/aac";
import { getContextualPredictions } from "@/lib/aac/predictions";
import { DEFAULT_SPEECH_CONFIG } from "@/lib/aac/voicePreferences";

// Initial state
const initialState: AACState = {
  sentence: [],
  activeCategory: "all",
  speechConfig: {
    ...DEFAULT_SPEECH_CONFIG,
    selectedVoiceURI: null,
  },
  sensoryMode: "vibrant",
  isFullscreen: false,
  gridColumns: 4,
  isSpeaking: false,
  highlightedWordIndex: -1,
  predictions: [],
  customWords: [],
  isLoadingCustomWords: false,
};

// Reducer function
function aacReducer(state: AACState, action: AACAction): AACState {
  switch (action.type) {
    case "ADD_WORD": {
      const newSentence = [...state.sentence, { word: action.word }];
      const lastWordId = action.word.id;
      const sentenceIds = newSentence.map((sw) => sw.word.id);
      const predictions = getContextualPredictions(sentenceIds, 4);
      return {
        ...state,
        sentence: newSentence,
        predictions,
      };
    }

    case "REMOVE_WORD": {
      const newSentence = state.sentence.filter((_, i) => i !== action.index);
      const sentenceIds = newSentence.map((sw) => sw.word.id);
      const predictions = getContextualPredictions(sentenceIds, 4);
      return {
        ...state,
        sentence: newSentence,
        predictions,
      };
    }

    case "CLEAR_SENTENCE": {
      return {
        ...state,
        sentence: [],
        predictions: getContextualPredictions([], 4),
        highlightedWordIndex: -1,
      };
    }

    case "SET_CATEGORY":
      return {
        ...state,
        activeCategory: action.category,
      };

    case "SET_SPEECH_CONFIG":
      return {
        ...state,
        speechConfig: {
          ...state.speechConfig,
          ...action.config,
        },
      };

    case "TOGGLE_SENSORY_MODE":
      return {
        ...state,
        sensoryMode: state.sensoryMode === "vibrant" ? "muted" : "vibrant",
      };

    case "SET_FULLSCREEN":
      return {
        ...state,
        isFullscreen: action.value,
      };

    case "SET_SPEAKING":
      return {
        ...state,
        isSpeaking: action.value,
        highlightedWordIndex: action.value ? 0 : -1,
      };

    case "SET_HIGHLIGHTED_WORD":
      return {
        ...state,
        highlightedWordIndex: action.index,
      };

    case "UPDATE_PREDICTIONS":
      return {
        ...state,
        predictions: action.words,
      };

    case "SET_CUSTOM_WORDS":
      return {
        ...state,
        customWords: action.words,
        isLoadingCustomWords: false,
      };

    case "ADD_CUSTOM_WORD":
      return {
        ...state,
        customWords: [...state.customWords, action.word],
      };

    case "UPDATE_CUSTOM_WORD":
      return {
        ...state,
        customWords: state.customWords.map((w) =>
          w.id === action.word.id ? action.word : w
        ),
      };

    case "DELETE_CUSTOM_WORD":
      return {
        ...state,
        customWords: state.customWords.filter((w) => w.id !== action.id),
      };

    case "SET_LOADING_CUSTOM_WORDS":
      return {
        ...state,
        isLoadingCustomWords: action.value,
      };

    case "SET_GRID_COLUMNS":
      return {
        ...state,
        gridColumns: action.columns,
      };

    default:
      return state;
  }
}

// Storage key for persisting settings
const STORAGE_KEY = "aac-settings";

// Load saved settings from localStorage
function loadSavedSettings(): Partial<AACState> {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        speechConfig: parsed.speechConfig || initialState.speechConfig,
        sensoryMode: parsed.sensoryMode || initialState.sensoryMode,
      };
    }
  } catch (error) {
    console.error("Error loading AAC settings:", error);
  }
  return {};
}

// Save settings to localStorage
function saveSettings(state: AACState): void {
  if (typeof window === "undefined") return;

  try {
    const toSave = {
      speechConfig: state.speechConfig,
      sensoryMode: state.sensoryMode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Error saving AAC settings:", error);
  }
}

export function useAACState() {
  // Initialize with saved settings
  const [state, dispatch] = useReducer(aacReducer, {
    ...initialState,
    ...loadSavedSettings(),
    predictions: getContextualPredictions([], 4),
  });

  // Save settings when they change
  useEffect(() => {
    saveSettings(state);
  }, [state.speechConfig, state.sensoryMode]);

  // Action creators
  const addWord = useCallback((word: AACWord) => {
    dispatch({ type: "ADD_WORD", word });
  }, []);

  const removeWord = useCallback((index: number) => {
    dispatch({ type: "REMOVE_WORD", index });
  }, []);

  const clearSentence = useCallback(() => {
    dispatch({ type: "CLEAR_SENTENCE" });
  }, []);

  const setCategory = useCallback((category: AACCategory | "all") => {
    dispatch({ type: "SET_CATEGORY", category });
  }, []);

  const setSpeechConfig = useCallback(
    (config: Partial<AACState["speechConfig"]>) => {
      dispatch({ type: "SET_SPEECH_CONFIG", config });
    },
    []
  );

  const toggleSensoryMode = useCallback(() => {
    dispatch({ type: "TOGGLE_SENSORY_MODE" });
  }, []);

  const setFullscreen = useCallback((value: boolean) => {
    dispatch({ type: "SET_FULLSCREEN", value });
  }, []);

  const setSpeaking = useCallback((value: boolean) => {
    dispatch({ type: "SET_SPEAKING", value });
  }, []);

  const setHighlightedWord = useCallback((index: number) => {
    dispatch({ type: "SET_HIGHLIGHTED_WORD", index });
  }, []);

  const setCustomWords = useCallback((words: AACCustomWord[]) => {
    dispatch({ type: "SET_CUSTOM_WORDS", words });
  }, []);

  const addCustomWord = useCallback((word: AACCustomWord) => {
    dispatch({ type: "ADD_CUSTOM_WORD", word });
  }, []);

  const updateCustomWord = useCallback((word: AACCustomWord) => {
    dispatch({ type: "UPDATE_CUSTOM_WORD", word });
  }, []);

  const deleteCustomWord = useCallback((id: string) => {
    dispatch({ type: "DELETE_CUSTOM_WORD", id });
  }, []);

  const setLoadingCustomWords = useCallback((value: boolean) => {
    dispatch({ type: "SET_LOADING_CUSTOM_WORDS", value });
  }, []);

  const setGridColumns = useCallback((columns: number) => {
    dispatch({ type: "SET_GRID_COLUMNS", columns });
  }, []);

  return {
    state,
    dispatch,
    // Action creators
    addWord,
    removeWord,
    clearSentence,
    setCategory,
    setSpeechConfig,
    toggleSensoryMode,
    setFullscreen,
    setSpeaking,
    setHighlightedWord,
    setCustomWords,
    addCustomWord,
    updateCustomWord,
    deleteCustomWord,
    setLoadingCustomWords,
    setGridColumns,
  };
}
