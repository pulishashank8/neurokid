"use client";

import { useState } from "react";
import {
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Maximize,
  Plus,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from "lucide-react";

interface AACControlPanelProps {
  sensoryMode: "vibrant" | "muted";
  onToggleSensoryMode: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  /** When true, navigation is locked (Guided Access); only Unlock button is available */
  navigationLocked?: boolean;
  onToggleNavigationLock?: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onAddWord: () => void;
  onUnlockAudio?: () => void;
}

export function AACControlPanel({
  sensoryMode,
  onToggleSensoryMode,
  onToggleFullscreen,
  isFullscreen,
  navigationLocked = false,
  onToggleNavigationLock,
  volume,
  onVolumeChange,
  selectedVoice,
  availableVoices,
  onVoiceChange,
  onAddWord,
  onUnlockAudio,
}: AACControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`
      w-full rounded-xl sm:rounded-2xl
      backdrop-blur-xl bg-white/10 dark:bg-white/5
      border border-white/20 dark:border-white/10
      ${sensoryMode === "muted" ? "shadow-sm" : "shadow-luxury"}
      overflow-hidden
    `}>
      {/* When navigation locked: only show Unlock; otherwise show Settings header + all buttons */}
      {!navigationLocked && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
            <span className="text-sm sm:text-base font-medium text-[var(--text)]">
              Settings
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
          )}
        </button>
      )}

      {/* Quick action buttons: when locked only Unlock; otherwise all */}
      <div className="flex items-center gap-2 px-3 sm:px-4 pb-3">
        {navigationLocked ? (
          /* Single prominent Unlock button when navigation is locked (Guided Access) */
          onToggleNavigationLock && (
            <button
              onClick={onToggleNavigationLock}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 min-h-[44px] touch-manipulation w-full justify-center"
              aria-label="Unlock navigation"
            >
              <Unlock className="w-5 h-5 shrink-0" />
              <span>Unlock</span>
            </button>
          )
        ) : (
          <>
            <button
              onClick={onToggleSensoryMode}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl
                text-xs sm:text-sm font-medium
                transition-all duration-200
                ${sensoryMode === "muted"
                  ? "bg-gray-500 text-white"
                  : "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                }
                hover:opacity-80
              `}
              aria-label={`Switch to ${sensoryMode === "muted" ? "vibrant" : "muted"} mode`}
            >
              {sensoryMode === "muted" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {sensoryMode === "muted" ? "Calm" : "Vibrant"}
              </span>
            </button>

            {onToggleNavigationLock && (
              <button
                onClick={onToggleNavigationLock}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 bg-red-500/20 text-red-700 dark:text-red-300 hover:opacity-80"
                aria-label="Lock navigation (Guided Access)"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}

            <button
              onClick={onToggleFullscreen}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl
                text-xs sm:text-sm font-medium
                transition-all duration-200
                ${isFullscreen
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                }
                hover:opacity-80
              `}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isFullscreen ? "Exit Focus" : "Focus Mode"}
              </span>
            </button>

            <button
              onClick={onAddWord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30"
              aria-label="Add custom word"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Word</span>
            </button>

            {onUnlockAudio && (
              <button
                onClick={onUnlockAudio}
                className="flex lg:hidden items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all animate-pulse"
              >
                <Volume2 className="w-4 h-4" />
                <span>Enable Sound</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Expanded settings - hidden when navigation locked */}
      {!navigationLocked && isExpanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-white/10">
          {/* Volume Control */}
          <div className="pt-4">
            <label className="flex items-center gap-2 text-sm text-[var(--muted)] mb-2">
              {volume > 0 ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full bg-gray-300 dark:bg-gray-600 appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-emerald-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
              "
            />
          </div>

          {/* Voice Selection */}
          {availableVoices.length > 0 && (
            <div>
              <label className="block text-sm text-[var(--muted)] mb-2">
                Voice
              </label>
              <select
                value={selectedVoice?.voiceURI || ""}
                onChange={(e) => {
                  const voice = availableVoices.find(
                    (v) => v.voiceURI === e.target.value
                  );
                  if (voice) onVoiceChange(voice);
                }}
                className="w-full px-3 py-2 rounded-xl
                  bg-white/10 dark:bg-white/5
                  border border-white/20 dark:border-white/10
                  text-sm text-[var(--text)]
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                "
              >
                {availableVoices.map((voice, index) => (
                  <option
                    key={`${voice.voiceURI}-${index}`}
                    value={voice.voiceURI}
                    className="bg-[var(--background)] text-[var(--text)]"
                  >
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
