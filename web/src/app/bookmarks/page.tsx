"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/community/PostCard";
import { PostCardSkeleton } from "@/components/community/LoadingSkeletons";
import { EmptyState } from "@/components/community/EmptyState";
import { useQuery } from "@tanstack/react-query";

interface Post {
  id: string;
  title: string;
  snippet: string;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  tags: Array<{ id: string; name: string; slug: string }>;
  author: { id: string; username: string; avatarUrl: string | null };
  voteScore: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
}

interface Bookmark {
  id: string;
  createdAt: string;
  post: Post;
}

export default function BookmarksPage() {
  const [page, setPage] = useState(1);

  // Fetch bookmarks
  const { data: bookmarksData, isLoading, isError } = useQuery({
    queryKey: ["bookmarks", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      const res = await fetch(`/api/bookmarks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
  });

  const bookmarks: Bookmark[] = bookmarksData?.bookmarks || [];
  const pagination = bookmarksData?.pagination;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-6 sm:py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              ← Back to Community
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-4">
            Saved Posts
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Your collection of bookmarked posts
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          ) : isError ? (
            <EmptyState
              icon="⚠️"
              title="Error loading bookmarks"
              description="Something went wrong. Please try again."
            />
          ) : bookmarks.length === 0 ? (
            <EmptyState
              icon="📌"
              title="No saved posts"
              description="Start bookmarking posts to read them later!"
              action={{
                label: "Explore Community",
                href: "/community",
              }}
            />
          ) : (
            <>
              {bookmarks.map((bookmark) => (
                <PostCard
                  key={bookmark.id}
                  post={bookmark.post}
                />
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
                        const pageNum =
                          page <= 3
                            ? i + 1
                            : page >= pagination.totalPages - 2
                            ? pagination.totalPages - 4 + i
                            : page - 2 + i;
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
        </div>
      </div>
    </div>
  );
}
