"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBestVoice, getEnglishVoices, DEFAULT_SPEECH_CONFIG } from "@/lib/aac/voicePreferences";

interface SpeechConfig {
  volume: number;
  pitch: number;
  rate: number;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, onWordBoundary?: (wordIndex: number) => void) => void;
  speakWords: (words: string[], onWordSpoken?: (index: number) => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  currentWordIndex: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  isSupported: boolean;
}

export function useSpeechSynthesis(
  config: SpeechConfig = DEFAULT_SPEECH_CONFIG
): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordCallbackRef = useRef<((index: number) => void) | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    if (!synth) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Load voices
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        const englishVoices = getEnglishVoices(voices);
        setAvailableVoices(englishVoices);

        // Auto-select best voice if none selected
        if (!selectedVoice) {
          const bestVoice = getBestVoice(voices);
          setSelectedVoice(bestVoice);
        }
      }
    };

    // Load voices immediately and on change
    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Speak a single string of text
  const speak = useCallback(
    (text: string, onWordBoundary?: (wordIndex: number) => void) => {
      if (!isSupported || !text) return;

      const synth = window.speechSynthesis;

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Apply configuration
      utterance.volume = config.volume;
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;

      // Apply selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Track word boundaries for karaoke effect
      let wordIndex = 0;
      const words = text.split(/\s+/);
      wordsRef.current = words;

      utterance.onboundary = (event) => {
        if (event.name === "word") {
          setCurrentWordIndex(wordIndex);
          onWordBoundary?.(wordIndex);
          wordIndex++;
        }
      };

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentWordIndex(0);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentWordIndex(-1);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setCurrentWordIndex(-1);
        utteranceRef.current = null;
      };

      synth.speak(utterance);
    },
    [config, selectedVoice, isSupported]
  );

  // Speak an array of words with callbacks for each word
  const speakWords = useCallback(
    (words: string[], onWordSpoken?: (index: number) => void) => {
      if (!isSupported || words.length === 0) return;

      const synth = window.speechSynthesis;
      synth.cancel();

      wordsRef.current = words;
      wordCallbackRef.current = onWordSpoken || null;

      let currentIndex = 0;
      setIsSpeaking(true);

      const speakNextWord = () => {
        if (currentIndex >= words.length) {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          wordCallbackRef.current = null;
          return;
        }

        const word = words[currentIndex];
        const utterance = new SpeechSynthesisUtterance(word);
        utteranceRef.current = utterance;

        utterance.volume = config.volume;
        utterance.pitch = config.pitch;
        utterance.rate = config.rate;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          setCurrentWordIndex(currentIndex);
          onWordSpoken?.(currentIndex);
        };

        utterance.onend = () => {
          currentIndex++;
          // Small pause between words
          setTimeout(speakNextWord, 100);
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event.error);
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
        };

        synth.speak(utterance);
      };

      speakNextWord();
    },
    [config, selectedVoice, isSupported]
  );

  // Cancel speech
  const cancel = useCallback(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    setIsSpeaking(false);
    setCurrentWordIndex(-1);
    utteranceRef.current = null;
  }, [isSupported]);

  return {
    speak,
    speakWords,
    cancel,
    isSpeaking,
    currentWordIndex,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    isSupported,
  };
}
