import { CursorPaginatedResult } from '@/domain/types';

export interface CreatePostInput {
  title: string;
  content: string;
  categoryId: string;
  tagIds?: string[];
  isAnonymous?: boolean;
  images?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  categoryId?: string;
  tagIds?: string[];
  isAnonymous?: boolean;
  images?: string[];
}

export interface ListPostsInput {
  cursor?: string;
  limit: number;
  sort: 'new' | 'top' | 'hot';
  categoryId?: string;
  tag?: string;
  search?: string;
  authorId?: string;
}

export interface FormattedPost {
  id: string;
  title: string;
  snippet: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string } | null;
  tags: Array<{ id: string; name: string; slug: string }>;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null; verifiedTherapist: boolean } | null;
  voteScore: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  images: string[];
  userVote?: number;
}

export interface IPostService {
  createPost(input: CreatePostInput, authorId: string): Promise<FormattedPost>;
  updatePost(id: string, input: UpdatePostInput, userId: string): Promise<FormattedPost>;
  listPosts(input: ListPostsInput, currentUserId?: string): Promise<CursorPaginatedResult<FormattedPost>>;
  getPost(id: string, currentUserId?: string): Promise<FormattedPost | null>;
  deletePost(id: string, userId: string): Promise<void>;
  vote(postId: string, userId: string, value: number): Promise<{ voteScore: number; userVote: number }>;
  removeVote(postId: string, userId: string): Promise<{ voteScore: number }>;
  pinPost(id: string, moderatorId: string): Promise<void>;
  unpinPost(id: string, moderatorId: string): Promise<void>;
  lockPost(id: string, moderatorId: string): Promise<void>;
  unlockPost(id: string, moderatorId: string): Promise<void>;
}
