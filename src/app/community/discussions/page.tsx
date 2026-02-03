"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Plus, Search, Sparkles, TrendingUp, Flame, Folder, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/community/PostCard";
import { PostCardSkeleton } from "@/features/community/LoadingSkeletons";

interface Post {
  id: string;
  title: string;
  snippet: string;
  createdAt: string;
  status?: "ACTIVE" | "REMOVED" | "LOCKED" | "ARCHIVED";
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  voteScore: number;
  commentCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isAnonymous?: boolean;
}

const sortOptions = [
  { value: "new", label: "Newest", icon: Sparkles },
  { value: "top", label: "Top Rated", icon: TrendingUp },
  { value: "hot", label: "Hot", icon: Flame },
] as const;

const categories = [
  "All Categories",
  "ABA Therapy",
  "School & IEPs",
  "Sleep Issues",
  "Communication",
  "Daily Living",
];

export default function CommunityDiscussionsPage() {
  const { data: session } = useSession();
  const [sortBy, setSortBy] = useState<"new" | "top" | "hot">("new");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch posts
  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ["posts", sortBy, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("sort", sortBy);
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const json = await res.json();
      // Handle different response formats
      return json.data || json.posts || json || [];
    },
  });

  // Ensure posts is always an array
  const posts = Array.isArray(postsData) ? postsData : [];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-3">
              <MessageSquare className="w-4 h-4" />
              Community Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Community Discussions
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Join the conversation with thousands of parents
            </p>
          </div>
          
          {session?.user && (
            <Link href="/community/new">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Tabs */}
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                        sortBy === option.value
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${sortBy === option.value ? "text-emerald-500 dark:text-emerald-400" : ""}`} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Posts */}
            {isLoading ? (
              <div className="space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-red-500 dark:text-red-400">Error loading posts. Please try again.</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No discussions yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to start a conversation!</p>
                {session?.user ? (
                  <Link href="/community/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-500">Create Post</Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">Sign In</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Categories */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Categories
              </h3>
              <nav className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === "All Categories" ? null : cat)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      (cat === "All Categories" && !selectedCategory) || selectedCategory === cat
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Folder className="w-4 h-4" />
                      {cat}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Quick Links */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/community/new" 
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Post
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/community" 
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Back to Community Home
                  </Link>
                </li>
              </ul>
            </div>

            {/* Guidelines */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Community Guidelines</h3>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 dark:text-emerald-400">•</span>
                  Be kind and supportive
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 dark:text-emerald-400">•</span>
                  No medical advice
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 dark:text-emerald-400">•</span>
                  Respect privacy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 dark:text-emerald-400">•</span>
                  Celebrate diversity
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
