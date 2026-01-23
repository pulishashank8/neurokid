"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCommentSchema, CreateCommentInput } from "@/lib/validations/community";
import toast from "react-hot-toast";

interface CommentComposerProps {
  postId: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentComposer({
  postId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "Share your thoughts...",
}: CommentComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      postId,
      parentCommentId,
      isAnonymous: false,
      content: "",
    },
    mode: "onChange",
  });

  const content = watch("content") ?? "";
  const isAnonymous = watch("isAnonymous");

  const onSubmit = async (data: CreateCommentInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create comment");
      }

      toast.success("Comment posted!");
      reset({
        postId,
        parentCommentId,
        isAnonymous: false,
        content: "",
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Hidden Fields for Validation */}
      <input type="hidden" {...register("postId")} />
      {parentCommentId && <input type="hidden" {...register("parentCommentId")} />}

      {/* Comment Input */}
      <textarea
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none min-h-[100px] sm:min-h-[120px] text-sm"
        {...register("content")}
      />

      {errors.content && (
        <p className="text-xs text-[var(--danger)]">{errors.content.message}</p>
      )}

      {/* Anonymous Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register("isAnonymous")}
          className="w-4 h-4 rounded accent-[var(--primary)]"
        />
        <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
          Post anonymously
        </span>
      </label>

      {/* Character count */}
      <p className="text-xs text-[var(--text-muted)]">
        {content.length} / 10,000 characters
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] font-medium transition-all text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isValid || content.trim().length === 0}
          className="flex-1 min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--primary)] text-white hover:opacity-90 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
