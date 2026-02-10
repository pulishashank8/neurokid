import { Bookmark } from '@/domain/interfaces/services/IBookmarkService';

export interface CreateBookmarkInput {
  userId: string;
  postId: string;
}

export interface IBookmarkRepository {
  findByUserId(userId: string): Promise<Bookmark[]>;
  findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null>;
  create(data: CreateBookmarkInput): Promise<Bookmark>;
  delete(userId: string, postId: string): Promise<void>;
  exists(userId: string, postId: string): Promise<boolean>;
}
