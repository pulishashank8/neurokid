import { Comment, CommentStatus, PaginatedResult } from '@/domain/types';

export interface CreateCommentInput {
  content: string;
  authorId: string;
  postId: string;
  parentCommentId?: string;
  isAnonymous?: boolean;
}

export interface UpdateCommentInput {
  content?: string;
  status?: CommentStatus;
}

export interface ListCommentsQuery {
  postId: string;
  parentCommentId?: string | null;
  limit: number;
  offset: number;
  includeReplies?: boolean;
}

export interface CommentWithAuthor {
  comment: Comment;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verifiedTherapist: boolean;
  } | null;
  replyCount: number;
}

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByIdWithAuthor(id: string): Promise<CommentWithAuthor | null>;
  list(query: ListCommentsQuery): Promise<PaginatedResult<CommentWithAuthor>>;
  create(data: CreateCommentInput): Promise<Comment>;
  update(id: string, data: UpdateCommentInput): Promise<Comment>;
  delete(id: string): Promise<void>;
  updateVoteScore(id: string, delta: number): Promise<void>;
  getAuthorId(commentId: string): Promise<string | null>;
  countByPostId(postId: string): Promise<number>;
}
