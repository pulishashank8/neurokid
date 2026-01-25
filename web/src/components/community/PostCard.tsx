"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { VoteButtons } from "./VoteButtons";
import { BookmarkButton } from "./BookmarkButton";
import { ReportButton } from "./ReportButton";
import { MessageCircle, Pin, Lock, Ban, User } from "lucide-react";

interface Post {
  id: string;
  title: string;
  snippet: string;
  createdAt: Date | string;
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

interface PostCardProps {
  post: Post;
  compact?: boolean;
  showActions?: boolean;
}

export function PostCard({
  post,
  compact = false,
  showActions = true,
}: PostCardProps) {
  const createdDate = new Date(post.createdAt);

  return (
    <article className="group relative bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-premium hover:shadow-premium-hover card-3d overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative flex">
        <div className="hidden sm:flex flex-col items-center gap-1 p-4 bg-[var(--surface2)]/50 border-r border-[var(--border)]/50">
          <VoteButtons
            targetType="POST"
            targetId={post.id}
            initialScore={post.voteScore}
          />
        </div>

        <div className="flex-1 p-5 sm:p-6">
          {(post.status === "REMOVED" || post.isPinned || post.isLocked) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {post.status === "REMOVED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                  <Ban className="w-3 h-3" />
                  Removed
                </span>
              )}
              {post.isPinned && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full animate-pulse-glow">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
              {post.isLocked && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
          )}

          <Link href={`/community/${post.id}`} className="block group/title">
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] group-hover/title:text-[var(--primary)] transition-colors duration-300 line-clamp-2 mb-2 tracking-tight">
              {post.title}
            </h3>
          </Link>

          {!compact && (
            <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2 leading-relaxed">
              {post.snippet}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--muted)] shadow-sm">
                <User className="w-4 h-4" />
              </div>
              {post.isAnonymous ? (
                <span className="font-medium text-sm text-[var(--muted)] italic">
                  Anonymous
                </span>
              ) : (
                <Link 
                  href={`/user/${encodeURIComponent(post.author.username)}`}
                  className="font-medium text-sm text-[var(--text)] hover:text-[var(--primary)] hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author.username}
                </Link>
              )}
            </div>
            
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            
            <Link 
              href={`/community?category=${post.category.id}`}
              className="inline-flex items-center px-3 py-1 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-semibold rounded-full transition-colors"
            >
              {post.category.name}
            </Link>
            
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            
            <time className="text-xs text-[var(--muted)]">
              {formatDistanceToNow(createdDate, { addSuffix: true })}
            </time>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 text-[var(--muted)] text-xs rounded-lg transition-colors cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))}
              {post.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 text-[var(--muted)] text-xs">
                  +{post.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/50">
            <div className="flex items-center gap-4">
              <Link 
                href={`/community/${post.id}`} 
                className="group/comments flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                <div className="p-2 rounded-xl bg-[var(--surface2)] group-hover/comments:bg-[var(--primary)]/10 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="font-semibold">{post.commentCount}</span>
                <span className="hidden sm:inline text-xs">comments</span>
              </Link>

              <div className="sm:hidden">
                <VoteButtons
                  targetType="POST"
                  targetId={post.id}
                  initialScore={post.voteScore}
                />
              </div>
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                <BookmarkButton postId={post.id} />
                <ReportButton targetType="POST" targetId={post.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
