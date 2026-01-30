// AAC Voice Preferences - Female Voice Selection for Speech Synthesis

import { VoicePreference } from "@/lib/types/aac";

// Preferred female voices in order of quality/preference
// These are commonly available across different platforms
export const PREFERRED_VOICES: VoicePreference[] = [
  // Google voices (Chrome)
  { name: "Google US English", lang: "en-US", priority: 1 },
  { name: "Google UK English Female", lang: "en-GB", priority: 2 },

  // Microsoft voices (Edge, Windows)
  { name: "Microsoft Zira", lang: "en-US", priority: 3 },
  { name: "Microsoft Aria", lang: "en-US", priority: 4 },
  { name: "Microsoft Jenny", lang: "en-US", priority: 5 },

  // Apple voices (Safari, macOS, iOS)
  { name: "Samantha", lang: "en-US", priority: 6 },
  { name: "Victoria", lang: "en-US", priority: 7 },
  { name: "Karen", lang: "en-AU", priority: 8 },
  { name: "Moira", lang: "en-IE", priority: 9 },
  { name: "Fiona", lang: "en-GB", priority: 10 },

  // Generic fallbacks with "female" in name
  { name: "Female", lang: "en", priority: 11 },
  { name: "Woman", lang: "en", priority: 12 },
];

// Keywords that indicate a female voice
const FEMALE_VOICE_KEYWORDS = [
  "female",
  "woman",
  "zira",
  "samantha",
  "victoria",
  "karen",
  "moira",
  "fiona",
  "jenny",
  "aria",
  "cortana",
  "siri",
  "google us english", // Google's default US voice is female
  "google uk english female",
];

// Keywords that indicate a male voice (to exclude)
const MALE_VOICE_KEYWORDS = [
  "male",
  "man",
  "david",
  "mark",
  "james",
  "daniel",
  "george",
  "microsoft david",
  "microsoft mark",
];

/**
 * Check if a voice name suggests it's a female voice
 */
export function isFemaleVoice(voiceName: string): boolean {
  const lowerName = voiceName.toLowerCase();

  // Check for male voice indicators first (to exclude)
  if (MALE_VOICE_KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return false;
  }

  // Check for female voice indicators
  return FEMALE_VOICE_KEYWORDS.some((keyword) => lowerName.includes(keyword));
}

/**
 * Get the best available voice from the system
 * Prefers female voices, falls back to any English voice
 */
export function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) {
    return null;
  }

  // Filter to English voices only
  const englishVoices = voices.filter(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );

  if (englishVoices.length === 0) {
    // Fall back to any voice if no English voices
    return voices[0];
  }

  // Try to find a preferred voice by name
  for (const pref of PREFERRED_VOICES) {
    const match = englishVoices.find(
      (v) => v.name.toLowerCase().includes(pref.name.toLowerCase())
    );
    if (match) {
      return match;
    }
  }

  // Try to find any female voice
  const femaleVoice = englishVoices.find((v) => isFemaleVoice(v.name));
  if (femaleVoice) {
    return femaleVoice;
  }

  // Fall back to the first English voice (prefer US English)
  const usVoice = englishVoices.find((v) => v.lang === "en-US");
  if (usVoice) {
    return usVoice;
  }

  return englishVoices[0];
}

/**
 * Get all available female voices
 */
export function getFemaleVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((v) => isFemaleVoice(v.name));
}

/**
 * Get all English voices sorted by preference
 */
export function getEnglishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const englishVoices = voices.filter(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );

  // Sort by preference: preferred voices first, then female voices, then others
  return englishVoices.sort((a, b) => {
    const aPref = PREFERRED_VOICES.find(
      (p) => a.name.toLowerCase().includes(p.name.toLowerCase())
    );
    const bPref = PREFERRED_VOICES.find(
      (p) => b.name.toLowerCase().includes(p.name.toLowerCase())
    );

    // If both have preferences, sort by priority
    if (aPref && bPref) {
      return aPref.priority - bPref.priority;
    }

    // Prefer preferred voices
    if (aPref) return -1;
    if (bPref) return 1;

    // Then prefer female voices
    const aFemale = isFemaleVoice(a.name);
    const bFemale = isFemaleVoice(b.name);
    if (aFemale && !bFemale) return -1;
    if (!aFemale && bFemale) return 1;

    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Default speech configuration for AAC
 * Optimized for autistic users with slightly slower, clearer speech
 */
export const DEFAULT_SPEECH_CONFIG = {
  volume: 1.0, // Maximum volume
  pitch: 1.0, // Natural pitch
  rate: 0.85, // Slightly slower for clarity
};
