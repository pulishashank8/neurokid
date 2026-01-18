"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [sort, setSort] = useState<"new" | "top" | "hot">("new");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get("category") || undefined
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  // Fetch posts
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
  });

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    router.push(`?${params.toString()}`);
  }, [selectedCategory, searchQuery, router]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const categories: Category[] = categoriesData?.categories || [];
  const posts: Post[] = postsData?.posts || [];
  const pagination = postsData?.pagination;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-16">
      {/* Header - NOT sticky, just a regular section */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-light)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Community
              </h1>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">
                Share, discuss, and connect with other parents
              </p>
            </div>
            <Link href="/community/new" className="hidden sm:block">
              <Button size="md" variant="primary">
                ✨ New Post
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} />

          {/* Sort & Mobile Filter Button */}
          <div className="flex items-center gap-3 mt-4 justify-between">
            <div className="flex-1 overflow-x-auto">
              <SortTabs selectedSort={sort} onSort={setSort} />
            </div>
            <button
              onClick={() => setShowFiltersDrawer(true)}
              className="min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] font-medium transition-all md:hidden flex-shrink-0"
              aria-label="Open filters"
            >
              🎚️ Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Stable Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px] gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-4 sm:p-6">
              <CategorySidebar
                categories={categories}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
          </aside>

          {/* Posts Feed - Center Column with min-w-0 to prevent overflow */}
          <main className="min-w-0 space-y-4 sm:space-y-6">
            {isLoading && (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
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
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center gap-2">
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
                            className={`min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] font-medium transition-all ${
                              page === pageNum
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--bg-elevated)]"
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
                      className="min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Right Sidebar - Placeholder for XL screens */}
          <aside className="hidden xl:block">
            <div className="sticky top-20 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                Community Info
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Welcome to the NeuroKind community! Share experiences, ask questions, and connect.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        position="left"
        title="Filters"
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
        className="md:hidden fixed bottom-6 right-6 z-30 min-h-[56px] min-w-[56px] rounded-full bg-[var(--primary)] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl"
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
