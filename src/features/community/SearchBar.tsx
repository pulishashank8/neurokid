"use client";

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search discussions...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div 
        className={`relative transition-all duration-300 ${
          isFocused ? "transform scale-[1.01]" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full px-5 py-3.5 pl-12 pr-12 bg-[var(--surface)] border-2 rounded-xl text-[var(--text)] placeholder-[var(--muted)] transition-all duration-300 text-sm input-premium ${
            isFocused 
              ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10" 
              : "border-[var(--border)] hover:border-[var(--primary)]/30"
          }`}
        />
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
          isFocused ? "text-[var(--primary)]" : "text-[var(--muted)]"
        }`}>
          <Search className="w-5 h-5" />
        </div>

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
