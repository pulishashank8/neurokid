import { AACItem, AACCategory } from '@/domain/types';

export interface CreateAACItemInput {
  userId: string;
  label: string;
  symbol: string;
  category: AACCategory;
  audioText?: string;
  order?: number;
}

export interface UpdateAACItemInput {
  label?: string;
  symbol?: string;
  category?: AACCategory;
  audioText?: string;
  order?: number;
  isActive?: boolean;
}

export interface ListAACItemsQuery {
  userId: string;
  category?: AACCategory;
  activeOnly?: boolean;
}

export interface IAACItemRepository {
  findById(id: string): Promise<AACItem | null>;
  findByIdAndUser(id: string, userId: string): Promise<AACItem | null>;
  list(query: ListAACItemsQuery): Promise<AACItem[]>;
  create(data: CreateAACItemInput): Promise<AACItem>;
  createMany(data: CreateAACItemInput[]): Promise<AACItem[]>;
  update(id: string, userId: string, data: UpdateAACItemInput): Promise<AACItem>;
  delete(id: string, userId: string): Promise<void>;
  reorder(userId: string, itemIds: string[]): Promise<void>;
  countByUser(userId: string): Promise<number>;
}
