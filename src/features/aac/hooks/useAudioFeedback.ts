"use client";

import { useCallback, useRef, useEffect } from "react";

interface UseAudioFeedbackReturn {
  playClickSound: () => void;
  playSuccessSound: () => void;
  playErrorSound: () => void;
  isSupported: boolean;
}

export function useAudioFeedback(): UseAudioFeedbackReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isSupported = typeof window !== "undefined" && "AudioContext" in window;

  // Initialize audio context on first interaction (required by browsers)
  const getAudioContext = useCallback(() => {
    if (!isSupported) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    // Resume context if suspended (browsers require user interaction)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, [isSupported]);

  // Play a simple beep/click sound
  const playClickSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Premium soft click: A5 note (880Hz), sine wave, quick decay
      oscillator.frequency.value = 880;
      oscillator.type = "sine";

      // Soft volume with quick fade out
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (error) {
      console.error("Error playing click sound:", error);
    }
  }, [getAudioContext]);

  // Play a pleasant success sound (two ascending tones)
  const playSuccessSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 523.25; // C5
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Second tone (higher)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 659.25; // E5
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (error) {
      console.error("Error playing success sound:", error);
    }
  }, [getAudioContext]);

  // Play a gentle error/warning sound
  const playErrorSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Low tone for error (F4)
      oscillator.frequency.value = 349.23;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.error("Error playing error sound:", error);
    }
  }, [getAudioContext]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    playClickSound,
    playSuccessSound,
    playErrorSound,
    isSupported,
  };
}
