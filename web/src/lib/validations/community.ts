import { z } from "zod";

/**
 * SECURITY: All schemas use .strict() to reject unexpected fields
 * This prevents injection of unexpected data and follows OWASP best practices
 */

// Post Schemas
export const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long").trim(),
  content: z.string().min(10, "Content must be at least 10 characters").max(50000, "Content too long"),
  categoryId: z.string().min(1, "Category is required"),
  tagIds: z.array(z.string().min(1)).max(5, "Maximum 5 tags allowed").default([]),
  isAnonymous: z.boolean().default(false).optional(),
}).strict(); // Reject unexpected fields

export const updatePostSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  content: z.string().min(10).max(50000).optional(),
  categoryId: z.string().min(1).optional(),
  tagIds: z.array(z.string().min(1)).max(5).optional(),
}).strict();

export const getPostsSchema = z.object({
  cursor: z.string().optional(), // For cursor pagination
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["new", "top", "hot"]).default("new"),
  categoryId: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  search: z.string().max(200).trim().optional(),
  // Keep page for backward compatibility
  page: z.coerce.number().int().positive().default(1).optional(),
}).strict();

// Comment Schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000, "Comment too long").trim(),
  postId: z.string().min(1, "Invalid post"),
  parentCommentId: z.string().min(1).optional(),
  isAnonymous: z.boolean().default(false).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000).trim(),
}).strict();

// Vote Schema
export const createVoteSchema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().min(1, "Invalid target"),
  value: z.number().int().min(-1).max(1), // -1 (downvote), 0 (remove), 1 (upvote)
}).strict();

// Bookmark Schema
export const toggleBookmarkSchema = z.object({
  postId: z.string().min(1, "Invalid post"),
}).strict();

// Report Schema
export const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: z.string().min(1, "Invalid target"),
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "MISINFORMATION",
    "INAPPROPRIATE",
    "MISINFO",
    "INAPPROPRIATE_CONTENT",
    "SELF_HARM",
    "OTHER"
  ]),
  description: z.string().max(1000).trim().optional(),
}).strict();

// User Profile Schema
export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").trim().optional(),
  displayName: z.string().min(1, "Display name is required").max(50, "Display name too long").trim().optional(),
  bio: z.string().max(500, "Bio too long").trim().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").max(500).optional(),
  location: z.string().max(100, "Location too long").trim().optional(),
  website: z.string().url("Invalid website URL").max(500).optional(),
}).strict();

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetPostsInput = z.infer<typeof getPostsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type ToggleBookmarkInput = z.infer<typeof toggleBookmarkSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
