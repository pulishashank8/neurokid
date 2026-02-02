"use client";

import { Folder, LayoutGrid, User, Heart } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (categoryId: string | undefined) => void;
  showMyPosts?: boolean;
  isMyPostsSelected?: boolean;
  onMyPostsSelect?: () => void;
  showMyLikes?: boolean;
  isMyLikesSelected?: boolean;
  onMyLikesSelect?: () => void;
}

export function CategorySidebar({
  categories,
  selectedId,
  onSelect,
  showMyPosts = true,
  isMyPostsSelected = false,
  onMyPostsSelect,
  showMyLikes = true,
  isMyLikesSelected = false,
  onMyLikesSelect,
}: CategorySidebarProps) {
  return (
    <nav className="space-y-1">
      <button
        onClick={() => onSelect(undefined)}
        className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
          !selectedId && !isMyPostsSelected && !isMyLikesSelected
            ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
            : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        }`}
      >
        <div className={`p-2 rounded-lg transition-colors ${
          !selectedId && !isMyPostsSelected && !isMyLikesSelected
            ? "bg-white/20" 
            : "bg-[var(--surface2)] group-hover:bg-[var(--primary)]/10"
        }`}>
          <LayoutGrid className="w-4 h-4" />
        </div>
        <span className="flex-1">All Categories</span>
      </button>

      {showMyPosts && onMyPostsSelect && (
        <button
          onClick={onMyPostsSelect}
          className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
            isMyPostsSelected
              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
              : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${
            isMyPostsSelected 
              ? "bg-white/20" 
              : "bg-[var(--surface2)] group-hover:bg-[var(--primary)]/10"
          }`}>
            <User className="w-4 h-4" />
          </div>
          <span className="flex-1">My Posts</span>
        </button>
      )}

      {showMyLikes && onMyLikesSelect && (
        <button
          onClick={onMyLikesSelect}
          className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
            isMyLikesSelected
              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
              : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${
            isMyLikesSelected 
              ? "bg-white/20" 
              : "bg-[var(--surface2)] group-hover:bg-[var(--primary)]/10"
          }`}>
            <Heart className="w-4 h-4" />
          </div>
          <span className="flex-1">My Likes</span>
        </button>
      )}

      <div className="py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      </div>

      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 animate-fade-up ${
            selectedId === category.id
              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
              : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          }`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className={`p-2 rounded-lg transition-colors ${
            selectedId === category.id 
              ? "bg-white/20" 
              : "bg-[var(--surface2)] group-hover:bg-[var(--primary)]/10"
          }`}>
            <Folder className="w-4 h-4" />
          </div>
          <span className="flex-1">{category.name}</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
              selectedId === category.id
                ? "bg-white/20 text-white"
                : "bg-[var(--surface2)] text-[var(--muted)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"
            }`}
          >
            {category.postCount}
          </span>
        </button>
      ))}
    </nav>
  );
}
