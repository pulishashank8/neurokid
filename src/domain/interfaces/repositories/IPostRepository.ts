import { Post, CursorPaginatedResult, PostStatus } from '@/domain/types';

export interface CreatePostInput {
  title: string;
  content: string;
  authorId?: string;
  categoryId: string;
  isAnonymous?: boolean;
  images?: string[];
  tagIds?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  categoryId?: string;
  isAnonymous?: boolean;
  status?: PostStatus;
  isPinned?: boolean;
  isLocked?: boolean;
  images?: string[];
}

export interface ListPostsQuery {
  cursor?: string;
  limit: number;
  sort: 'new' | 'top' | 'hot';
  categoryId?: string;
  tag?: string;
  search?: string;
  authorId?: string;
  status?: PostStatus;
}

export interface PostWithAuthor {
  post: Post;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verifiedTherapist: boolean;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findByIdWithAuthor(id: string): Promise<PostWithAuthor | null>;
  list(query: ListPostsQuery): Promise<CursorPaginatedResult<Post>>;
  listWithAuthors(query: ListPostsQuery): Promise<CursorPaginatedResult<PostWithAuthor>>;
  create(data: CreatePostInput): Promise<Post>;
  update(id: string, data: UpdatePostInput): Promise<Post>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
  updateVoteScore(id: string, delta: number): Promise<void>;
  updateCommentCount(id: string, delta: number): Promise<void>;
  existsDuplicate(authorId: string, title: string, since: Date): Promise<boolean>;
  getAuthorId(postId: string): Promise<string | null>;
}
