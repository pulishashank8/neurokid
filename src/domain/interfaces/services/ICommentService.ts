import { PaginatedResult } from '@/domain/types';

export interface CreateCommentInput {
  content: string;
  postId: string;
  parentCommentId?: string;
  isAnonymous?: boolean;
}

export interface UpdateCommentInput {
  content: string;
}

export interface FormattedComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null; verifiedTherapist: boolean } | null;
  voteScore: number;
  replyCount: number;
  isAnonymous: boolean;
  userVote?: number;
}

export interface ICommentService {
  createComment(input: CreateCommentInput, authorId: string): Promise<FormattedComment>;
  updateComment(id: string, input: UpdateCommentInput, userId: string): Promise<FormattedComment>;
  listComments(postId: string, parentCommentId: string | null, limit: number, offset: number, currentUserId?: string): Promise<PaginatedResult<FormattedComment>>;
  getComment(id: string, currentUserId?: string): Promise<FormattedComment | null>;
  deleteComment(id: string, userId: string): Promise<void>;
  vote(commentId: string, userId: string, value: number): Promise<{ voteScore: number; userVote: number }>;
  removeVote(commentId: string, userId: string): Promise<{ voteScore: number }>;
}
