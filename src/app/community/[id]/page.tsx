"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { VoteButtons } from "@/components/community/VoteButtons";
import { BookmarkButton } from "@/components/community/BookmarkButton";
import { ReportButton } from "@/components/community/ReportButton";
import { CommentComposer } from "@/components/community/CommentComposer";
import { CommentThreadList } from "@/components/community/CommentThread";
import { CommentSkeleton, LoadingSpinner } from "@/components/community/LoadingSkeletons";
import { EmptyState } from "@/components/community/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  status?: "ACTIVE" | "REMOVED" | "LOCKED" | "ARCHIVED";
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{ id: string; name: string; slug: string }>;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  voteScore: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  voteScore: number;
  isAnonymous: boolean;
  parentCommentId?: string;
  children?: Comment[];
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [postId, setPostId] = useState<string>("");
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    params.then((p) => setPostId(p.id));
  }, [params]);

  // Fetch post
  const { data: post, isLoading: postLoading, isError, error } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Fetch post error:", errorData);
        throw new Error(errorData.error?.message || errorData.details || "Failed to fetch post");
      }
      const json = await res.json();
      return (json.data || json) as Post;
    },
    enabled: !!postId,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!postId) return null;
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!postId,
  });

  const handleCommentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  };

  const comments: Comment[] = commentsData?.comments || [];

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-20 px-4 flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Post</h2>
          <p>{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
          <Link href="/community">
            <Button className="mt-4" variant="secondary">Back to Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!postId) return <LoadingSpinner size="lg" />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20 pb-6 sm:pt-24 sm:pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Button */}
        <Link href="/community">
          <Button variant="ghost" size="sm">
            ← Back to Community
          </Button>
        </Link>

        {/* Post */}
        {postLoading ? (
          <LoadingSpinner size="lg" />
        ) : post ? (
          <>
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8 mt-6">
              {/* Status & Pinned indicators */}
              <div className="mb-4 flex flex-wrap gap-2">
                {post.status === "REMOVED" && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    🚫 Removed by moderators
                  </div>
                )}
                {post.isPinned && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold rounded-full">
                    📌 Pinned
                  </div>
                )}
                {post.isLocked && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    🔒 Locked
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--muted)] flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  {post.isAnonymous ? (
                    <p className="text-sm sm:text-base font-semibold text-[var(--muted)] italic">
                      Anonymous
                    </p>
                  ) : (
                    <Link 
                      href={`/user/${encodeURIComponent(post.author.username)}`}
                      className="text-sm sm:text-base font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] hover:underline transition-colors"
                    >
                      {post.author.username}
                    </Link>
                  )}
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full">
                  {post.category.name}
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs rounded-full"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
                {post.title}
              </h1>

              {/* Content */}
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-6 text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                {post.content}
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    <span>{post.commentCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                  <VoteButtons
                    targetType="POST"
                    targetId={post.id}
                    initialScore={post.voteScore}
                  />
                  <BookmarkButton postId={post.id} />
                  <ReportButton targetType="POST" targetId={post.id} />
                </div>
              </div>
            </div>

            {post.isLocked ? (
              <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8 mt-6">
                <p className="text-center text-[var(--text-muted)]">
                  🔒 This post is locked. New comments are disabled.
                </p>
              </div>
            ) : !session ? (
              <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8 mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
                  Join the conversation
                </h2>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-6 text-center">
                  <p className="text-[var(--text-secondary)] mb-4">
                    Sign in to join the conversation and share your thoughts.
                  </p>
                  <Link href="/login">
                    <Button size="lg">
                      Sign in to comment
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8 mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
                  Join the conversation
                </h2>
                <CommentComposer
                  postId={post.id}
                  onSuccess={handleCommentSuccess}
                  placeholder="What are your thoughts?"
                />
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8 mt-6">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
                Comments ({post.commentCount})
              </h2>

              {commentsLoading ? (
                <>
                  <CommentSkeleton />
                  <CommentSkeleton />
                  <CommentSkeleton />
                </>
              ) : comments.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="No comments yet"
                  description="Be the first to share your thoughts!"
                />
              ) : (
                <CommentThreadList
                  comments={comments}
                  postId={post.id}
                  onUpdate={handleCommentSuccess}
                />
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon="❌"
            title="Post not found"
            description="This post may have been deleted or doesn't exist."
            action={{
              label: "Go back to community",
              href: "/community",
            }}
          />
        )}
      </div>
    </div>
  );
}
