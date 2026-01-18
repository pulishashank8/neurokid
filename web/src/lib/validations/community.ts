import { z } from "zod";

// Post Schemas
export const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  content: z.string().min(10, "Content must be at least 10 characters").max(50000, "Content too long"),
  categoryId: z.string().min(1, "Category is required"),
  tagIds: z.array(z.string().min(1)).max(5, "Maximum 5 tags allowed").default([]),
  isAnonymous: z.boolean().default(false).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).max(50000).optional(),
  categoryId: z.string().min(1).optional(),
  tagIds: z.array(z.string().min(1)).max(5).optional(),
});

export const getPostsSchema = z.object({
  cursor: z.string().optional(), // For cursor pagination
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["new", "top", "hot"]).default("new"),
  categoryId: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
  // Keep page for backward compatibility
  page: z.coerce.number().int().positive().default(1).optional(),
});

// Comment Schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000, "Comment too long"),
  postId: z.string().min(1, "Invalid post"),
  parentCommentId: z.string().min(1).optional(),
  isAnonymous: z.boolean().default(false).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

// Vote Schema
export const createVoteSchema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().min(1, "Invalid target"),
  value: z.number().int().min(-1).max(1), // -1 (downvote), 0 (remove), 1 (upvote)
});

// Bookmark Schema
export const toggleBookmarkSchema = z.object({
  postId: z.string().min(1, "Invalid post"),
});

// Report Schema
export const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: z.string().min(1, "Invalid target"),
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "MISINFO",
    "SELF_HARM",
    "INAPPROPRIATE_CONTENT",
    "OTHER"
  ]),
  details: z.string().max(1000).optional(),
});

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetPostsInput = z.infer<typeof getPostsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type ToggleBookmarkInput = z.infer<typeof toggleBookmarkSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
