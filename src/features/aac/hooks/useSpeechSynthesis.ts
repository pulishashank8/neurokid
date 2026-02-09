"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBestVoice, getEnglishVoices, DEFAULT_SPEECH_CONFIG } from "@/features/aac/services/voicePreferences";

interface SpeechConfig {
  volume: number;
  pitch: number;
  rate: number;
  openaiVoice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
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

  // Audio element for OpenAI TTS
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Detect if we're on a mobile device (especially iOS)
  const isMobileDevice = useCallback(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const isIOS = useCallback(() => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Initialize audio context and synthesis on first user interaction (required for mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAudio = async () => {
      // 1. Initialize AudioContext
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
            console.log("Audio context created for mobile");
          }
        } catch (e) {
          console.warn("Could not create AudioContext:", e);
        }
      }

      // Resume if suspended
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume().catch(console.warn);
      }

      // 2. "Warm up" Web Speech API for iOS
      // Standard trick: speak an empty string on first click to unlock it
      if (window.speechSynthesis) {
        try {
          // Some versions of iOS need a real (but short/silent) utterance
          const utterance = new SpeechSynthesisUtterance("");
          utterance.volume = 0;
          window.speechSynthesis.speak(utterance);
          console.log("SpeechSynthesis warmed up for mobile");
        } catch (e) {
          console.warn("SpeechSynthesis warm up failed:", e);
        }
      }
    };

    // Initialize on any user interaction
    const events = ["touchstart", "touchend", "mousedown", "keydown"];
    const handleInteraction = () => {
      initAudio();
      // Only need to do this once
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // Speak a single string of text
  const speak = useCallback(
    async (text: string, onWordBoundary?: (wordIndex: number) => void) => {
      if (!text) return;

      // Cancel any ongoing speech
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsSpeaking(true);
      setCurrentWordIndex(0);

      // CRITICAL: On iOS, we MUST trigger a synchronous audio action to "claim" the 
      // audio stack before the asynchronous fetch call below.
      if (typeof window !== "undefined" && isIOS()) {
        try {
          const kick = new Audio();
          kick.play().catch(() => { });

          if (audioContextRef.current?.state === "suspended") {
            audioContextRef.current.resume().catch(console.warn);
          }
        } catch (e) {
          console.warn("Audio kick failed:", e);
        }
      }

      // Try OpenAI TTS first for smoother, child-friendly voices
      const currentVoice = config.openaiVoice || "nova";
      try {
        const response = await fetch("/api/ai/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Cache-busting to ensure voice changes are respected
            "X-Request-Time": Date.now().toString(),
          },
          body: JSON.stringify({
            text: text.slice(0, 4096), // OpenAI has 4096 char limit
            voice: currentVoice, // Use configured voice or default to nova
            // Add timestamp to prevent any caching issues
            _t: Date.now(),
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");

          // Check if we got actual audio back (not a JSON fallback response)
          if (contentType?.includes("audio/mpeg")) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.volume = config.volume;

            // CRITICAL: For mobile, load the audio immediately
            if (isMobileDevice()) {
              audio.load();
            }

            // Word boundary simulation for karaoke effect
            const words = text.split(/\s+/);
            wordsRef.current = words;
            let wordIndex = 0;
            const avgWordDuration = (text.length * 60) / (words.length * 1000); // Approximate

            const wordInterval = setInterval(() => {
              if (wordIndex < words.length) {
                setCurrentWordIndex(wordIndex);
                onWordBoundary?.(wordIndex);
                wordIndex++;
              } else {
                clearInterval(wordInterval);
              }
            }, avgWordDuration);

            audio.onended = () => {
              clearInterval(wordInterval);
              setIsSpeaking(false);
              setCurrentWordIndex(-1);
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
            };

            audio.onerror = (e) => {
              console.error("Audio playback error on mobile:", e);
              clearInterval(wordInterval);
              setIsSpeaking(false);
              setCurrentWordIndex(-1);
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;

              // Fallback to browser TTS on error
              console.log("Falling back to browser TTS due to audio error");
            };

            try {
              // Use a promise to handle play() properly on mobile
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                await playPromise;
              }
              return;
            } catch (playError) {
              console.error("Audio play() failed:", playError);
              // Will fall through to browser TTS
            }
          }
        }
      } catch (error) {
        console.log("OpenAI TTS unavailable, falling back to browser TTS", error);
      }

      // Fallback to browser speech synthesis
      if (!isSupported) {
        setIsSpeaking(false);
        setCurrentWordIndex(-1);
        return;
      }

      const synth = window.speechSynthesis;

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
        // Ignore interrupted/canceled errors as they happen when rapid clicking
        if (event.error === "interrupted" || event.error === "canceled") {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          return;
        }
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
    // Stop OpenAI TTS audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop browser speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setCurrentWordIndex(-1);
    utteranceRef.current = null;
  }, []);

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
