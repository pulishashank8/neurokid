"use client";

import { useState, useCallback, useEffect } from "react";
import { AACCustomWord, CreateAACWordRequest, UpdateAACWordRequest } from "@/lib/types/aac";

interface UseCustomVocabularyReturn {
  customWords: AACCustomWord[];
  isLoading: boolean;
  error: string | null;
  fetchVocabulary: () => Promise<void>;
  createWord: (word: CreateAACWordRequest) => Promise<AACCustomWord | null>;
  updateWord: (id: string, updates: UpdateAACWordRequest) => Promise<AACCustomWord | null>;
  deleteWord: (id: string) => Promise<boolean>;
}

export function useCustomVocabulary(): UseCustomVocabularyReturn {
  const [customWords, setCustomWords] = useState<AACCustomWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all custom vocabulary for the user
  const fetchVocabulary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/aac/vocabulary");

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - silently return empty
          setCustomWords([]);
          return;
        }
        throw new Error("Failed to fetch vocabulary");
      }

      const data = await response.json();

      // Transform API response to AACCustomWord format
      const words: AACCustomWord[] = data.map((item: {
        id: string;
        userId: string;
        label: string;
        symbol: string;
        category: string;
        audioText: string | null;
        order: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }) => ({
        id: item.id,
        userId: item.userId,
        label: item.label,
        symbol: item.symbol,
        category: item.category.toLowerCase() as AACCustomWord["category"],
        audioText: item.audioText || undefined,
        order: item.order,
        isActive: item.isActive,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));

      setCustomWords(words);
    } catch (err) {
      console.error("Error fetching custom vocabulary:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vocabulary");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new custom word
  const createWord = useCallback(
    async (word: CreateAACWordRequest): Promise<AACCustomWord | null> => {
      setError(null);

      try {
        const response = await fetch("/api/aac/vocabulary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...word,
            category: word.category.toUpperCase(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create word");
        }

        const data = await response.json();

        const newWord: AACCustomWord = {
          id: data.id,
          userId: data.userId,
          label: data.label,
          symbol: data.symbol,
          category: data.category.toLowerCase() as AACCustomWord["category"],
          audioText: data.audioText || undefined,
          order: data.order,
          isActive: data.isActive,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };

        setCustomWords((prev) => [...prev, newWord]);
        return newWord;
      } catch (err) {
        console.error("Error creating custom word:", err);
        setError(err instanceof Error ? err.message : "Failed to create word");
        return null;
      }
    },
    []
  );

  // Update an existing custom word
  const updateWord = useCallback(
    async (id: string, updates: UpdateAACWordRequest): Promise<AACCustomWord | null> => {
      setError(null);

      try {
        const response = await fetch(`/api/aac/vocabulary/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...updates,
            category: updates.category?.toUpperCase(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update word");
        }

        const data = await response.json();

        const updatedWord: AACCustomWord = {
          id: data.id,
          userId: data.userId,
          label: data.label,
          symbol: data.symbol,
          category: data.category.toLowerCase() as AACCustomWord["category"],
          audioText: data.audioText || undefined,
          order: data.order,
          isActive: data.isActive,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };

        setCustomWords((prev) =>
          prev.map((w) => (w.id === id ? updatedWord : w))
        );
        return updatedWord;
      } catch (err) {
        console.error("Error updating custom word:", err);
        setError(err instanceof Error ? err.message : "Failed to update word");
        return null;
      }
    },
    []
  );

  // Delete a custom word
  const deleteWord = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/aac/vocabulary/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete word");
      }

      setCustomWords((prev) => prev.filter((w) => w.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting custom word:", err);
      setError(err instanceof Error ? err.message : "Failed to delete word");
      return false;
    }
  }, []);

  // Fetch vocabulary on mount
  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  return {
    customWords,
    isLoading,
    error,
    fetchVocabulary,
    createWord,
    updateWord,
    deleteWord,
  };
}
