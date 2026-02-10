import { Vote } from '@/domain/types';

export interface CreateVoteInput {
  userId: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  value: number;
}

export interface IVoteRepository {
  findByUserAndTarget(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<Vote | null>;
  upsert(data: CreateVoteInput): Promise<Vote>;
  delete(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<void>;
  getUserVotesForTargets(userId: string, targetType: 'POST' | 'COMMENT', targetIds: string[]): Promise<Map<string, number>>;
  countByTarget(targetType: 'POST' | 'COMMENT', targetId: string): Promise<{ up: number; down: number }>;
  getCountsByTargets(
    targetType: 'POST' | 'COMMENT',
    targetIds: string[]
  ): Promise<Map<string, { likeCount: number; dislikeCount: number }>>;
}
