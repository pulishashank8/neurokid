import { Tag } from '@/domain/types';

export interface CreateTagInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByIds(ids: string[]): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  findByPostId(postId: string): Promise<Tag[]>;
  create(data: CreateTagInput): Promise<Tag>;
  update(id: string, data: UpdateTagInput): Promise<Tag>;
  delete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  getPopular(limit: number): Promise<Array<Tag & { count: number }>>;
}
