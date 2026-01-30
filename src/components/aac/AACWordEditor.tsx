"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Trash2 } from "lucide-react";
import { AACCategory, AACCustomWord, CreateAACWordRequest } from "@/lib/types/aac";
import { AAC_CATEGORIES } from "@/lib/aac/vocabulary";

interface AACWordEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: CreateAACWordRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingWord?: AACCustomWord | null;
  sensoryMode: "vibrant" | "muted";
}

const EMOJI_SUGGESTIONS = [
  "😊", "😢", "😡", "😴", "🤔", "🎉", "💪", "👍", "👎", "❤️",
  "🏠", "🚗", "🎮", "📱", "🎵", "⚽", "🐕", "🐱", "🌈", "🌟",
  "🍎", "🍕", "🍦", "🥤", "🍪", "🥪", "🍔", "🌮", "🥗", "🍿",
];

export function AACWordEditor({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingWord,
  sensoryMode,
}: AACWordEditorProps) {
  const [label, setLabel] = useState("");
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState<AACCategory>("custom");
  const [audioText, setAudioText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (editingWord) {
      setLabel(editingWord.label);
      setSymbol(editingWord.symbol);
      setCategory(editingWord.category);
      setAudioText(editingWord.audioText || "");
    } else {
      setLabel("");
      setSymbol("");
      setCategory("custom");
      setAudioText("");
    }
    setError(null);
  }, [editingWord, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Please enter a word label");
      return;
    }

    if (!symbol.trim()) {
      setError("Please select or enter an emoji/symbol");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        label: label.trim(),
        symbol: symbol.trim(),
        category,
        audioText: audioText.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save word");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingWord || !onDelete) return;

    if (!confirm("Are you sure you want to delete this word?")) return;

    setIsSaving(true);
    try {
      await onDelete(editingWord.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete word");
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = AAC_CATEGORIES.filter((c) => c.id !== "all");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              sm:w-full sm:max-w-md
              bg-[var(--surface)] rounded-3xl shadow-2xl z-50
              flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                {editingWord ? "Edit Word" : "Add New Word"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[var(--surface2)] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Symbol/Emoji */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Emoji/Symbol *
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Enter or select emoji"
                    maxLength={10}
                    className="flex-1 px-4 py-3 rounded-xl
                      bg-[var(--surface2)] border border-[var(--border)]
                      text-2xl text-center
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                    "
                  />
                  {symbol && (
                    <span className="text-4xl">{symbol}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSymbol(emoji)}
                      className={`
                        w-10 h-10 rounded-xl text-xl
                        flex items-center justify-center
                        transition-all duration-200
                        ${symbol === emoji
                          ? "bg-emerald-500 ring-2 ring-emerald-500"
                          : "bg-[var(--surface2)] hover:bg-[var(--surface2)]/80"
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Word Label *
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Grandma, School, Tablet"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl
                    bg-[var(--surface2)] border border-[var(--border)]
                    text-[var(--text)]
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                  "
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AACCategory)}
                  className="w-full px-4 py-3 rounded-xl
                    bg-[var(--surface2)] border border-[var(--border)]
                    text-[var(--text)]
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                  "
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Audio Text */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Custom Pronunciation (optional)
                </label>
                <input
                  type="text"
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  placeholder="How it should be spoken (leave blank to use label)"
                  maxLength={255}
                  className="w-full px-4 py-3 rounded-xl
                    bg-[var(--surface2)] border border-[var(--border)]
                    text-[var(--text)]
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                  "
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Example: For "Mom" you might enter "Mommy" or "Mama"
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center gap-3 p-4 sm:p-6 border-t border-[var(--border)]">
              {editingWord && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                    bg-red-500/10 text-red-600 dark:text-red-400
                    hover:bg-red-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}

              <div className="flex-1" />

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl
                  text-[var(--muted)] hover:bg-[var(--surface2)]
                  transition-colors
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSaving || !label.trim() || !symbol.trim()}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl
                  font-bold text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  ${sensoryMode === "muted"
                    ? "bg-emerald-600"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg"
                  }
                `}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
