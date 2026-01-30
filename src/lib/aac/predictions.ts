// AAC Smart Word Prediction Logic

import { AACWord } from "@/lib/types/aac";
import { DEFAULT_VOCABULARY, getWordById } from "./vocabulary";

// Prediction rules based on common AAC usage patterns
const PREDICTION_RULES: Record<string, string[]> = {
  // After "I" - common continuations
  i: ["want", "need", "feel", "like", "am"],

  // After "I want" or "want"
  want: ["pizza", "water", "hug", "play", "more", "food", "snack"],

  // After "I need" or "need"
  need: ["help", "bathroom", "break", "quiet", "space", "headphones"],

  // After emotional words
  happy: ["thank-you", "love", "play"],
  sad: ["hug", "help", "break"],
  angry: ["stop", "space", "break", "quiet"],
  scared: ["help", "hug", "call-mom", "call-dad"],

  // After requests
  help: ["please", "now"],
  more: ["please", "food", "water", "snack"],

  // After sensory words
  "too-loud": ["quiet", "headphones", "stop", "break"],
  "too-bright": ["stop", "break", "space"],

  // After food items
  pizza: ["please", "more", "want"],
  water: ["please", "more", "want"],
  juice: ["please", "more"],
  snack: ["please", "more", "want"],

  // After greetings
  hello: ["friend", "happy"],
  goodbye: ["love", "thank-you"],

  // After core words
  yes: ["please", "thank-you", "more"],
  no: ["stop", "thank-you"],
  stop: ["please", "no", "break"],
  "all-done": ["thank-you", "go"],
  go: ["home", "bathroom", "play"],

  // After actions
  play: ["please", "friend", "more"],
  eat: ["food", "snack", "pizza"],
  drink: ["water", "juice", "milkshake"],
};

// Get predictions based on the last word in the sentence
export function getPredictions(lastWordId: string | null, limit: number = 4): AACWord[] {
  if (!lastWordId) {
    // Default predictions when starting a sentence
    return ["i", "want", "need", "help", "yes", "no"]
      .map(getWordById)
      .filter((w): w is AACWord => w !== undefined)
      .slice(0, limit);
  }

  // First check if the word has explicit predictions
  const word = getWordById(lastWordId);
  if (word?.predictions && word.predictions.length > 0) {
    const explicitPredictions = word.predictions
      .map(getWordById)
      .filter((w): w is AACWord => w !== undefined);

    if (explicitPredictions.length >= limit) {
      return explicitPredictions.slice(0, limit);
    }

    // Supplement with rule-based predictions
    const ruleBased = PREDICTION_RULES[lastWordId] || [];
    const ruleWords = ruleBased
      .filter((id) => !word.predictions?.includes(id))
      .map(getWordById)
      .filter((w): w is AACWord => w !== undefined);

    return [...explicitPredictions, ...ruleWords].slice(0, limit);
  }

  // Use rule-based predictions
  const predictions = PREDICTION_RULES[lastWordId] || [];
  const predictionWords = predictions
    .map(getWordById)
    .filter((w): w is AACWord => w !== undefined);

  // If no specific predictions, return common follow-ups
  if (predictionWords.length === 0) {
    return ["please", "more", "help", "thank-you"]
      .map(getWordById)
      .filter((w): w is AACWord => w !== undefined)
      .slice(0, limit);
  }

  return predictionWords.slice(0, limit);
}

// Get predictions based on entire sentence context
export function getContextualPredictions(
  sentenceWordIds: string[],
  limit: number = 4
): AACWord[] {
  if (sentenceWordIds.length === 0) {
    return getPredictions(null, limit);
  }

  const lastWordId = sentenceWordIds[sentenceWordIds.length - 1];

  // Special handling for "I want" or "I need" patterns
  if (sentenceWordIds.length >= 2) {
    const secondLast = sentenceWordIds[sentenceWordIds.length - 2];

    if (secondLast === "i" && lastWordId === "want") {
      // After "I want" - suggest specific items
      return ["pizza", "water", "hug", "play", "more", "snack"]
        .map(getWordById)
        .filter((w): w is AACWord => w !== undefined)
        .slice(0, limit);
    }

    if (secondLast === "i" && lastWordId === "need") {
      // After "I need" - suggest urgent needs
      return ["help", "bathroom", "break", "quiet", "headphones"]
        .map(getWordById)
        .filter((w): w is AACWord => w !== undefined)
        .slice(0, limit);
    }

    if (secondLast === "i" && lastWordId === "feel") {
      // After "I feel" - suggest emotions
      return ["happy", "sad", "angry", "scared", "sick"]
        .map(getWordById)
        .filter((w): w is AACWord => w !== undefined)
        .slice(0, limit);
    }
  }

  // Default to last word predictions
  return getPredictions(lastWordId, limit);
}

// Build a speakable sentence from word IDs
export function buildSentence(words: AACWord[]): string {
  if (words.length === 0) return "";

  return words
    .map((word) => word.audioText || word.label)
    .join(" ");
}
