"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Plus, Search, Sparkles, TrendingUp, Flame, Folder, LayoutGrid, User, Heart, Bookmark, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/community/PostCard";
import { PostCardSkeleton } from "@/features/community/LoadingSkeletons";
import { BackButton } from "@/components/ui/BackButton";

type FeedFilter = "all" | "my-posts" | "my-likes" | "my-dislikes" | "saved";

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
  voteScore?: number;
  likeCount?: number;
  dislikeCount?: number;
  userVote?: number;
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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");

  // Fetch all posts
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
      return json.data || json.posts || json || [];
    },
    enabled: feedFilter === "all",
  });

  // Fetch user's own posts
  const { data: myPostsData, isLoading: myPostsLoading } = useQuery({
    queryKey: ["my-posts", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts?authorId=${session?.user?.id}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch my posts");
      const json = await res.json();
      return json.data || json.posts || json || [];
    },
    enabled: feedFilter === "my-posts" && !!session?.user?.id,
  });

  // Fetch user's liked posts (uses session - no username needed)
  const { data: likedPostsData, isLoading: likedPostsLoading } = useQuery({
    queryKey: ["liked-posts", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/me/upvoted");
      if (!res.ok) return [];
      const json = await res.json();
      return json.posts || [];
    },
    enabled: feedFilter === "my-likes" && !!session?.user?.id,
  });

  // Fetch user's disliked posts (uses session - no username needed)
  const { data: dislikedPostsData, isLoading: dislikedPostsLoading } = useQuery({
    queryKey: ["disliked-posts", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/me/downvoted");
      if (!res.ok) return [];
      const json = await res.json();
      return json.posts || [];
    },
    enabled: feedFilter === "my-dislikes" && !!session?.user?.id,
  });

  // Fetch user's saved posts (uses session - no username needed)
  const { data: savedPostsData, isLoading: savedPostsLoading } = useQuery({
    queryKey: ["saved-posts", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/me/saved");
      if (!res.ok) return [];
      const json = await res.json();
      return json.posts || [];
    },
    enabled: feedFilter === "saved" && !!session?.user?.id,
  });

  // Determine which posts to show based on filter
  const getDisplayPosts = () => {
    switch (feedFilter) {
      case "my-posts":
        return Array.isArray(myPostsData) ? myPostsData : [];
      case "my-likes":
        return Array.isArray(likedPostsData) ? likedPostsData : [];
      case "my-dislikes":
        return Array.isArray(dislikedPostsData) ? dislikedPostsData : [];
      case "saved":
        return Array.isArray(savedPostsData) ? savedPostsData : [];
      default:
        return Array.isArray(postsData) ? postsData : [];
    }
  };

  const getIsLoading = () => {
    switch (feedFilter) {
      case "my-posts":
        return myPostsLoading;
      case "my-likes":
        return likedPostsLoading;
      case "my-dislikes":
        return dislikedPostsLoading;
      case "saved":
        return savedPostsLoading;
      default:
        return isLoading;
    }
  };

  const posts = getDisplayPosts();
  const currentLoading = getIsLoading();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallbackPath="/community" />
        </div>

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
            {/* Feed Filter Tabs (My Posts, Likes, Saved) */}
            {session?.user && (
              <div className="mb-4 overflow-x-auto">
                <div className="flex flex-wrap gap-2 min-w-0">
                  <button
                    onClick={() => setFeedFilter("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      feedFilter === "all"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    All Posts
                  </button>
                  <button
                    onClick={() => setFeedFilter("my-posts")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      feedFilter === "my-posts"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    My Posts
                  </button>
                  <button
                    onClick={() => setFeedFilter("my-likes")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      feedFilter === "my-likes"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    My Likes
                  </button>
                  <button
                    onClick={() => setFeedFilter("my-dislikes")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      feedFilter === "my-dislikes"
                        ? "bg-red-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    My Dislikes
                  </button>
                  <button
                    onClick={() => setFeedFilter("saved")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      feedFilter === "saved"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    Saved
                  </button>
                </div>
              </div>
            )}

            {/* Sort Tabs - only show for "all" filter */}
            {feedFilter === "all" && (
              <div className="mb-6 overflow-x-auto">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit min-w-0">
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${sortBy === option.value
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
            )}

            {/* Posts */}
            {currentLoading ? (
              <div className="space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : error && feedFilter === "all" ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-red-500 dark:text-red-400">Error loading posts. Please try again.</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  {feedFilter === "my-posts" && <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
                  {feedFilter === "my-likes" && <Heart className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
                  {feedFilter === "my-dislikes" && <ThumbsDown className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
                  {feedFilter === "saved" && <Bookmark className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
                  {feedFilter === "all" && <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {feedFilter === "my-posts" && "You haven't posted yet"}
                  {feedFilter === "my-likes" && "No liked posts yet"}
                  {feedFilter === "my-dislikes" && "No disliked posts yet"}
                  {feedFilter === "saved" && "No saved posts yet"}
                  {feedFilter === "all" && "No discussions yet"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {feedFilter === "my-posts" && "Share your thoughts with the community!"}
                  {feedFilter === "my-likes" && "Posts you like (thumbs up) will appear here."}
                  {feedFilter === "my-dislikes" && "Posts you dislike (thumbs down) will appear here."}
                  {feedFilter === "saved" && "Bookmark posts to find them easily later."}
                  {feedFilter === "all" && "Be the first to start a conversation!"}
                </p>
                {feedFilter === "all" || feedFilter === "my-posts" ? (
                  session?.user ? (
                    <Link href="/community/new">
                      <Button className="bg-emerald-600 hover:bg-emerald-500">Create Post</Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">Sign In</Button>
                    </Link>
                  )
                ) : (
                  <Button
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    onClick={() => setFeedFilter("all")}
                  >
                    Browse All Posts
                  </Button>
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
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${(cat === "All Categories" && !selectedCategory) || selectedCategory === cat
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
