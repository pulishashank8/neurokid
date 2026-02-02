"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseBiometricGuardProps {
  holdDuration?: number; // Duration in ms to hold before triggering (default 2500ms)
  onExit: () => void;
  enabled?: boolean;
}

interface UseBiometricGuardReturn {
  progress: number; // 0-100
  isHolding: boolean;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

export function useBiometricGuard({
  holdDuration = 2500,
  onExit,
  enabled = true,
}: UseBiometricGuardProps): UseBiometricGuardReturn {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Clear all timers and reset state
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
    startTimeRef.current = 0;
  }, []);

  // Update progress based on elapsed time
  const updateProgress = useCallback(() => {
    if (!isHolding || !enabled) return;

    const elapsed = Date.now() - startTimeRef.current;
    const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
    setProgress(newProgress);

    if (newProgress >= 100) {
      // Trigger exit callback
      onExit();
      reset();
    } else {
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [holdDuration, onExit, isHolding, enabled, reset]);

  // Start hold detection
  const startHold = useCallback(() => {
    if (!enabled) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [enabled, updateProgress]);

  // Stop hold detection
  const stopHold = useCallback(() => {
    reset();
  }, [reset]);

  // Event handlers
  const handleTouchStart = useCallback(() => {
    startHold();
  }, [startHold]);

  const handleTouchEnd = useCallback(() => {
    stopHold();
  }, [stopHold]);

  const handleMouseDown = useCallback(() => {
    startHold();
  }, [startHold]);

  const handleMouseUp = useCallback(() => {
    stopHold();
  }, [stopHold]);

  const handleMouseLeave = useCallback(() => {
    if (isHolding) {
      stopHold();
    }
  }, [isHolding, stopHold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Re-run updateProgress when isHolding changes
  useEffect(() => {
    if (isHolding && enabled) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHolding, enabled, updateProgress]);

  return {
    progress,
    isHolding,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
  };
}
