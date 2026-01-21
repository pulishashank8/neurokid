"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/community/PostCard";
import { CategorySidebar } from "@/components/community/CategorySidebar";
import { SearchBar } from "@/components/community/SearchBar";
import { SortTabs } from "@/components/community/SortTabs";
import { PostCardSkeleton, LoadingSpinner } from "@/components/community/LoadingSkeletons";
import { EmptyState } from "@/components/community/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle } from "lucide-react";

interface Post {
  id: string;
  title: string;
  snippet: string;
  createdAt: string;
  status?: "ACTIVE" | "REMOVED" | "LOCKED" | "ARCHIVED";
  category: { id: string; name: string; slug: string };
  tags: Array<{ id: string; name: string; slug: string }>;
  author: { id: string; username: string; avatarUrl: string | null };
  voteScore: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [sort, setSort] = useState<"new" | "top" | "hot">("new");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get("category") || undefined
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);

  // Fetch categories - MUST be called before any conditional returns
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    enabled: !!session, // Only fetch when authenticated
  });

  // Fetch posts - MUST be called before any conditional returns
  const { data: postsData, isLoading, isError } = useQuery({
    queryKey: ["posts", page, sort, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort,
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/posts?${params}`);
      return res.json();
    },
    enabled: !!session, // Only fetch when authenticated
  });

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    const newUrl = params.toString() ? `/community?${params}` : "/community";
    router.replace(newUrl, { scroll: false });
  }, [selectedCategory, searchQuery, router]);

  // Redirect to login if not authenticated - AFTER all hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/community");
    }
  }, [status, router]);

  // ALL useCallback hooks MUST be before conditional returns
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  // Compute derived values
  const categories: Category[] = categoriesData?.categories || [];
  const posts: Post[] = postsData?.posts || [];
  const pagination = postsData?.pagination;

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }


  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-[var(--background)] border-b border-[var(--border)] pt-8 pb-12">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider w-fit mb-4">
                Community Hub
              </div>
              <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight mb-4">
                NeuroKid <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Community</span>
              </h1>
              <p className="text-lg text-[var(--muted)] leading-relaxed">
                A safe space to share experiences, ask questions, and connect with other parents. In NeuroKid, anonymity isn't hiding — it's healing.
              </p>
            </div>

            <Link href="/community/new" className="hidden sm:block flex-shrink-0">
              <button className="flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all">
                ✨ Start Discussion
              </button>
            </Link>
          </div>

          <div className="bg-[var(--surface)]/80 backdrop-blur-md rounded-2xl border border-[var(--border)] p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} />
              </div>
              <div className="flex-shrink-0 overflow-x-auto">
                <SortTabs selectedSort={sort} onSort={setSort} />
              </div>
              <button
                onClick={() => setShowFiltersDrawer(true)}
                className="md:hidden px-4 py-2 rounded-xl bg-[var(--surface2)] text-[var(--muted)] border border-[var(--border)] font-medium"
              >
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Categories</h3>
                <CategorySidebar
                  categories={categories}
                  selectedId={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            </div>
          </aside>

          {/* Posts Feed */}
          <main className="min-w-0 space-y-6">
            {isLoading && (
              <div className="space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            )}

            {!isLoading && isError && (
              <EmptyState
                icon="⚠️"
                title="Error loading posts"
                description="Something went wrong. Please try again."
              />
            )}

            {!isLoading && !isError && posts.length === 0 && (
              <EmptyState
                icon="📝"
                title="No posts yet"
                description={
                  selectedCategory || searchQuery
                    ? "No posts match your filters. Try adjusting your search."
                    : "Be the first to start a discussion!"
                }
                action={{
                  label: "Create a post",
                  href: "/community/new",
                }}
              />
            )}

            {!isLoading && !isError && posts.length > 0 && (
              <>
                <div className="grid gap-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-[var(--border)]">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return pageNum <= pagination.totalPages ? pageNum : null;
                        }
                      ).map((pageNum) =>
                        pageNum ? (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-xl font-medium transition-all ${page === pageNum
                              ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                              : "text-[var(--muted)] hover:bg-[var(--surface2)]"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ) : null
                      )}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 rounded-xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              {/* Community Guidelines Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-1 shadow-lg shadow-indigo-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative h-full bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    <h3 className="font-bold text-lg">Guidelines</h3>
                  </div>

                  <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
                    We are a supportive family. Please be kind, respectful, and mindful of others' journeys.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-white/90">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-200 text-xs">🚫</span>
                      <span>No medical advice</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-white/90">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-200 text-xs">❤️</span>
                      <span>Be supportive & kind</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-white/90">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-200 text-xs">🔒</span>
                      <span>Respect privacy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Mini */}
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex gap-3 relative z-10">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                    <strong>Disclaimer:</strong> Content shared by users is for informational purposes only. NeuroKid does not endorse specific treatments. Always consult a professional.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        position="left"
        title="Filter Topics"
      >
        <div className="p-4">
          <CategorySidebar
            categories={categories}
            selectedId={selectedCategory}
            onSelect={(categoryId) => {
              setSelectedCategory(categoryId);
              setShowFiltersDrawer(false);
            }}
          />
        </div>
      </Drawer>

      {/* Mobile Floating Action Button */}
      <Link
        href="/community/new"
        className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 hover:scale-110 transition-all flex items-center justify-center text-2xl"
        title="Create new post"
      >
        ✨
      </Link>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CommunityPageContent />
    </Suspense>
  );
}
