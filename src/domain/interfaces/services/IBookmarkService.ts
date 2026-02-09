export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface IBookmarkService {
  listByUser(userId: string): Promise<Bookmark[]>;
  create(userId: string, postId: string): Promise<Bookmark>;
  delete(userId: string, postId: string): Promise<void>;
  isBookmarked(userId: string, postId: string): Promise<boolean>;
}
