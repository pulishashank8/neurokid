import { useState, useEffect } from 'react';
import type { LocationData, StepProgress, StepStatus, AgeRange } from '@/features/autism-navigator/types/roadmap';

const STORAGE_KEY = 'neurokid_roadmap_state';

interface RoadmapState {
  location: LocationData | null;
  stepProgress: StepProgress[];
  plainLanguageMode: boolean;
}

const defaultStepProgress: StepProgress[] = [
  { stepId: 1, status: 'not_started' },
  { stepId: 2, status: 'not_started' },
  { stepId: 3, status: 'not_started' },
  { stepId: 4, status: 'not_started' },
  { stepId: 5, status: 'not_started' },
  { stepId: 6, status: 'not_started' },
];

export function useRoadmapState() {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [stepProgress, setStepProgressState] = useState<StepProgress[]>(defaultStepProgress);
  const [plainLanguageMode, setPlainLanguageModeState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: RoadmapState = JSON.parse(saved);
        if (parsed.location) setLocationState(parsed.location);
        if (parsed.stepProgress) setStepProgressState(parsed.stepProgress);
        if (typeof parsed.plainLanguageMode === 'boolean') {
          setPlainLanguageModeState(parsed.plainLanguageMode);
        }
      }
    } catch (e) {
      console.error('Error loading roadmap state:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;

    const state: RoadmapState = {
      location,
      stepProgress,
      plainLanguageMode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [location, stepProgress, plainLanguageMode, isLoaded]);

  const setLocation = (data: LocationData) => {
    setLocationState(data);
  };

  const updateStepStatus = (stepId: number, status: StepStatus) => {
    setStepProgressState(prev =>
      prev.map(step =>
        step.stepId === stepId ? { ...step, status } : step
      )
    );
  };

  const getStepStatus = (stepId: number): StepStatus => {
    return stepProgress.find(s => s.stepId === stepId)?.status || 'not_started';
  };

  const setPlainLanguageMode = (enabled: boolean) => {
    setPlainLanguageModeState(enabled);
  };

  const resetProgress = () => {
    setStepProgressState(defaultStepProgress);
    setLocationState(null);
  };

  return {
    location,
    setLocation,
    stepProgress,
    updateStepStatus,
    getStepStatus,
    plainLanguageMode,
    setPlainLanguageMode,
    resetProgress,
    isLoaded,
  };
}
