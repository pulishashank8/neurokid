import { Category } from '@/domain/types';

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  create(data: CreateCategoryInput): Promise<Category>;
  update(id: string, data: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
