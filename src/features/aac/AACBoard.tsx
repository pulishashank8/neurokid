"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AACCard } from "./AACCard";
import { AACCategoryTabs } from "./AACCategoryTabs";
import { AACSentenceBar } from "./AACSentenceBar";
import { AACPredictionBar } from "./AACPredictionBar";
import { AACControlPanel } from "./AACControlPanel";
import { AACWordEditor } from "./AACWordEditor";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";
import { useAudioFeedback } from "./hooks/useAudioFeedback";
import { useCustomVocabulary } from "./hooks/useCustomVocabulary";
import {
  DEFAULT_VOCABULARY,
  AAC_CATEGORIES,
  getWordById,
} from "@/features/aac/services/vocabulary";
import { DEFAULT_SPEECH_CONFIG } from "@/features/aac/services/voicePreferences";
import {
  AACWord,
  AACCategory,
  AACSentenceWord,
  CreateAACWordRequest,
} from "@/lib/types/aac";

interface AACBoardProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
}

export function AACBoard({ onToggleFullscreen, isFullscreen, isLocked = false, onToggleLock }: AACBoardProps) {
  // State
  const [sentence, setSentence] = useState<AACSentenceWord[]>([]);
  const [activeCategory, setActiveCategory] = useState<AACCategory | "all">("all");
  const [sensoryMode, setSensoryMode] = useState<"vibrant" | "muted">("vibrant");

  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_SPEECH_CONFIG.volume);

  // Custom hooks
  const {
    speak,
    speakWords,
    cancel,
    isSpeaking,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    isSupported: isSpeechSupported,
  } = useSpeechSynthesis({
    ...DEFAULT_SPEECH_CONFIG,
    volume,
  });

  const { playClickSound, playSuccessSound } = useAudioFeedback();

  const {
    customWords,
    isLoading: isLoadingCustom,
    createWord,
    deleteWord,
  } = useCustomVocabulary();

  // Combine default and custom vocabulary
  const allVocabulary = useMemo(() => {
    const customAACWords: AACWord[] = customWords
      .filter((w) => w.isActive)
      .map((w) => ({
        id: w.id,
        label: w.label,
        symbol: w.symbol,
        category: w.category,
        audioText: w.audioText,
        isCore: false,
      }));

    return [...DEFAULT_VOCABULARY, ...customAACWords];
  }, [customWords]);

  // Filter vocabulary by category
  const filteredVocabulary = useMemo(() => {
    if (activeCategory === "all") {
      return allVocabulary;
    }
    return allVocabulary.filter((word) => word.category === activeCategory);
  }, [allVocabulary, activeCategory]);

  // Get predictions based on last word
  const predictions = useMemo(() => {
    if (sentence.length === 0) return [];

    const lastWord = sentence[sentence.length - 1].word;
    if (!lastWord.predictions || lastWord.predictions.length === 0) return [];

    return lastWord.predictions
      .map((id) => getWordById(id))
      .filter((w): w is AACWord => w !== undefined)
      .slice(0, 4);
  }, [sentence]);

  // Handle word press - communication buttons always work, even when navigation is locked
  const handleWordPress = useCallback(
    (word: AACWord) => {
      playClickSound();

      // Speak immediately
      speak(word.audioText || word.label);

      // Add word to sentence
      setSentence((prev) => [...prev, { word, spokenAt: new Date() }]);
    },
    [playClickSound, speak]
  );

  // Handle word removal
  const handleRemoveWord = useCallback((index: number) => {
    setSentence((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle clear sentence
  const handleClearSentence = useCallback(() => {
    setSentence([]);
    cancel();
  }, [cancel]);



  // Handle sensory mode toggle
  const handleToggleSensoryMode = useCallback(() => {
    setSensoryMode((prev) => (prev === "vibrant" ? "muted" : "vibrant"));
  }, []);


  // Handle add word
  const handleSaveWord = useCallback(
    async (word: CreateAACWordRequest) => {
      await createWord(word);
    },
    [createWord]
  );

  // Handle delete word
  const handleDeleteWord = useCallback(
    async (id: string) => {
      await deleteWord(id);
    },
    [deleteWord]
  );

  return (
    <div
      className={`
        flex flex-col h-full w-full
        ${sensoryMode === "muted" ? "sensory-muted" : ""}
      `}
    >
      {/* Sentence Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3">
        <AACSentenceBar
          sentence={sentence}
          onRemoveWord={handleRemoveWord}
          onClear={handleClearSentence}
          sensoryMode={sensoryMode}
        />
      </div>

      {/* Prediction Bar */}
      {predictions.length > 0 && (
        <div className="px-2 sm:px-4 pb-2">
          <AACPredictionBar
            predictions={predictions}
            onSelect={handleWordPress}
            sensoryMode={sensoryMode}
          />
        </div>
      )}

      {/* Category Tabs - disabled when locked (navigation restriction) */}
      <div className={`px-2 sm:px-4 pb-2 sm:pb-3 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
        <AACCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          sensoryMode={sensoryMode}
        />
      </div>

      {/* Vocabulary Grid - stays fully interactive when locked (communication must work) */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-2 sm:pb-4 relative">
        <div className="aac-grid">
          {filteredVocabulary.map((word) => (
            <AACCard
              key={word.id}
              word={word}
              onPress={handleWordPress}
              sensoryMode={sensoryMode}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredVocabulary.length === 0 && !isLoadingCustom && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-[var(--muted)] text-sm sm:text-base">
              No words in this category yet.
            </p>
            {!isLocked && (
              <button
                onClick={() => setIsWordEditorOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
              >
                Add your first word
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoadingCustom && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Control Panel - when locked, only Unlock button is accessible */}
      <div className="px-2 sm:px-4 pb-2 sm:pb-4">
        <AACControlPanel
          sensoryMode={sensoryMode}
          onToggleSensoryMode={handleToggleSensoryMode}
          onToggleFullscreen={onToggleFullscreen}
          isFullscreen={isFullscreen}
          isLocked={isLocked}
          onToggleLock={onToggleLock ?? (() => {})}
          volume={volume}
          onVolumeChange={setVolume}
          selectedVoice={selectedVoice}
          availableVoices={availableVoices}
          onVoiceChange={setSelectedVoice}
          onAddWord={() => !isLocked && setIsWordEditorOpen(true)}
        />
      </div>

      {/* Word Editor Modal */}
      <AACWordEditor
        isOpen={isWordEditorOpen}
        onClose={() => setIsWordEditorOpen(false)}
        onSave={handleSaveWord}
        onDelete={handleDeleteWord}
        sensoryMode={sensoryMode}
      />
    </div>
  );
}
