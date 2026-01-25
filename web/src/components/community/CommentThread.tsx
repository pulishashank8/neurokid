"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { VoteButtons } from "./VoteButtons";
import { ReportButton } from "./ReportButton";
import { CommentComposer } from "./CommentComposer";

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onReplySuccess?: () => void;
}

export function CommentThread({
  comment,
  postId,
  depth = 0,
  onReplySuccess,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [showChildren, setShowChildren] = useState(true);
  const { data: session } = useSession();
  const createdDate = new Date(comment.createdAt);

  const maxDepth = 5; // Limit nesting
  const canNest = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-6" : ""} border-l border-[var(--border-light)] pl-0 sm:pl-4`}>
      <div className="py-4 sm:py-6">
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--muted)] flex-shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {comment.isAnonymous ? (
                <p className="text-xs sm:text-sm font-semibold text-[var(--muted)] italic">
                  Anonymous
                </p>
              ) : (
                <Link 
                  href={`/user/${encodeURIComponent(comment.author.username)}`}
                  className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] hover:underline transition-colors"
                >
                  {comment.author.username}
                </Link>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </p>
            </div>

            {/* Content */}
            <div className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] whitespace-pre-wrap break-words">
              {comment.content}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3">
              <div className="flex items-center gap-2">
                <VoteButtons
                  targetType="COMMENT"
                  targetId={comment.id}
                  initialScore={comment.voteScore}
                />
              </div>

              <div className="flex items-center gap-2">
                {canNest && (
                  <button
                    onClick={() => {
                      if (!session) {
                        toast.error("Please login to reply", { id: "login-required" });
                        return;
                      }
                      setIsReplying(!isReplying);
                    }}
                    className="min-h-[44px] px-3 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] transition-all"
                  >
                    {isReplying ? "Cancel" : "Reply"}
                  </button>
                )}

                <ReportButton targetType="COMMENT" targetId={comment.id} />
              </div>
            </div>

            {/* Reply Composer */}
            {isReplying && canNest && (
              <div className="mt-4">
                <CommentComposer
                  postId={postId}
                  parentCommentId={comment.id}
                  placeholder="Write a reply..."
                  onSuccess={() => {
                    setIsReplying(false);
                    onReplySuccess?.();
                  }}
                  onCancel={() => setIsReplying(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Children Comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowChildren(!showChildren)}
              className="text-xs sm:text-sm font-medium text-[var(--primary)] hover:underline mb-3"
            >
              {showChildren ? "▼" : "▶"} {comment.children.length} repl
              {comment.children.length === 1 ? "y" : "ies"}
            </button>

            {showChildren && (
              <div className="space-y-0">
                {comment.children.map((child) => (
                  <CommentThread
                    key={child.id}
                    comment={child}
                    postId={postId}
                    depth={depth + 1}
                    onReplySuccess={onReplySuccess}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Thread list component */
interface CommentThreadListProps {
  comments: Comment[];
  postId: string;
  onUpdate?: () => void;
}

export function CommentThreadList({
  comments,
  postId,
  onUpdate,
}: CommentThreadListProps) {
  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          postId={postId}
          onReplySuccess={onUpdate}
        />
      ))}
    </div>
  );
}
