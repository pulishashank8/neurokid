import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { VoteRepository } from '@/infrastructure/repositories/VoteRepository';
import { createMockPrismaClient } from '../../utils/mock-prisma';

describe('VoteRepository', () => {
  let repository: VoteRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    container.clearInstances();
    mockPrisma = createMockPrismaClient();
    
    container.register(TOKENS.DatabaseConnection, {
      useValue: {
        getClient: vi.fn().mockReturnValue(mockPrisma),
        getReadClient: vi.fn().mockReturnValue(mockPrisma),
      },
    });

    repository = container.resolve(VoteRepository);
  });

  describe('findByUserAndTarget', () => {
    it('should return vote when found', async () => {
      const mockVote = {
        id: 'vote-1',
        userId: 'user-1',
        targetType: 'POST',
        targetId: 'post-1',
        value: 1,
        createdAt: new Date(),
      };

      mockPrisma.vote.findUnique.mockResolvedValue(mockVote);

      // Note: parameter order is (userId, targetType, targetId)
      const result = await repository.findByUserAndTarget('user-1', 'POST', 'post-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('vote-1');
      expect(result?.value).toBe(1);
      expect(mockPrisma.vote.findUnique).toHaveBeenCalledWith({
        where: {
          userId_targetId_targetType: {
            userId: 'user-1',
            targetId: 'post-1',
            targetType: 'POST',
          },
        },
      });
    });

    it('should return null when vote not found', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserAndTarget('user-1', 'POST', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create vote when none exists', async () => {
      const input = {
        userId: 'user-1',
        targetType: 'POST' as const,
        targetId: 'post-1',
        value: 1,
      };

      const mockVote = {
        id: 'vote-1',
        userId: input.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        value: input.value,
        createdAt: new Date(),
      };

      mockPrisma.vote.upsert.mockResolvedValue(mockVote);

      const result = await repository.upsert(input);

      expect(result.value).toBe(1);
      expect(mockPrisma.vote.upsert).toHaveBeenCalledWith({
        where: {
          userId_targetId_targetType: {
            userId: input.userId,
            targetId: input.targetId,
            targetType: input.targetType,
          },
        },
        create: {
          userId: input.userId,
          targetType: input.targetType,
          targetId: input.targetId,
          value: input.value,
        },
        update: {
          value: input.value,
        },
      });
    });

    it('should update vote when already exists', async () => {
      const input = {
        userId: 'user-1',
        targetType: 'POST' as const,
        targetId: 'post-1',
        value: -1,
      };

      const mockVote = {
        id: 'vote-1',
        userId: input.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        value: input.value,
        createdAt: new Date(),
      };

      mockPrisma.vote.upsert.mockResolvedValue(mockVote);

      const result = await repository.upsert(input);

      expect(result.value).toBe(-1);
    });

    it('should handle COMMENT target type', async () => {
      const input = {
        userId: 'user-1',
        targetType: 'COMMENT' as const,
        targetId: 'comment-1',
        value: 1,
      };

      const mockVote = {
        id: 'vote-2',
        ...input,
        createdAt: new Date(),
      };

      mockPrisma.vote.upsert.mockResolvedValue(mockVote);

      const result = await repository.upsert(input);

      expect(result.targetType).toBe('COMMENT');
      expect(result.targetId).toBe('comment-1');
    });
  });

  describe('delete', () => {
    it('should delete vote by composite key', async () => {
      mockPrisma.vote.deleteMany.mockResolvedValue({ count: 1 });

      await repository.delete('user-1', 'POST', 'post-1');

      expect(mockPrisma.vote.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          targetType: 'POST',
          targetId: 'post-1',
        },
      });
    });

    it('should delete COMMENT vote', async () => {
      mockPrisma.vote.deleteMany.mockResolvedValue({ count: 1 });

      await repository.delete('user-1', 'COMMENT', 'comment-1');

      expect(mockPrisma.vote.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          targetType: 'COMMENT',
          targetId: 'comment-1',
        },
      });
    });
  });

  describe('countByTarget', () => {
    it('should return upvotes and downvotes for target', async () => {
      mockPrisma.vote.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

      // Note: parameter order is (targetType, targetId)
      const result = await repository.countByTarget('POST', 'post-1');

      expect(result).toEqual({ up: 10, down: 3 });
      expect(mockPrisma.vote.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.vote.count).toHaveBeenNthCalledWith(1, {
        where: { targetType: 'POST', targetId: 'post-1', value: 1 },
      });
      expect(mockPrisma.vote.count).toHaveBeenNthCalledWith(2, {
        where: { targetType: 'POST', targetId: 'post-1', value: -1 },
      });
    });

    it('should handle no votes', async () => {
      mockPrisma.vote.count.mockResolvedValue(0);

      const result = await repository.countByTarget('POST', 'post-1');

      expect(result).toEqual({ up: 0, down: 0 });
    });

    it('should work for COMMENT targets', async () => {
      mockPrisma.vote.count.mockResolvedValueOnce(5).mockResolvedValueOnce(1);

      const result = await repository.countByTarget('COMMENT', 'comment-1');

      expect(result).toEqual({ up: 5, down: 1 });
      expect(mockPrisma.vote.count).toHaveBeenNthCalledWith(1, {
        where: { targetType: 'COMMENT', targetId: 'comment-1', value: 1 },
      });
    });
  });

  describe('getUserVotesForTargets', () => {
    it('should return map of votes for targets', async () => {
      const mockVotes = [
        { targetId: 'post-1', value: 1 },
        { targetId: 'post-2', value: -1 },
        { targetId: 'post-3', value: 1 },
      ];

      mockPrisma.vote.findMany.mockResolvedValue(mockVotes);

      // Note: parameter order is (userId, targetType, targetIds)
      const result = await repository.getUserVotesForTargets('user-1', 'POST', ['post-1', 'post-2', 'post-3']);

      expect(result.size).toBe(3);
      expect(result.get('post-1')).toBe(1);
      expect(result.get('post-2')).toBe(-1);
      expect(result.get('post-3')).toBe(1);
      expect(mockPrisma.vote.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          targetType: 'POST',
          targetId: { in: ['post-1', 'post-2', 'post-3'] },
        },
        select: {
          targetId: true,
          value: true,
        },
      });
    });

    it('should return empty map when user has no votes', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await repository.getUserVotesForTargets('user-1', 'POST', ['post-1', 'post-2']);

      expect(result.size).toBe(0);
    });

    it('should work for COMMENT targets', async () => {
      const mockVotes = [
        { targetId: 'comment-1', value: 1 },
      ];

      mockPrisma.vote.findMany.mockResolvedValue(mockVotes);

      const result = await repository.getUserVotesForTargets('user-1', 'COMMENT', ['comment-1', 'comment-2']);

      expect(result.size).toBe(1);
      expect(result.get('comment-1')).toBe(1);
    });

    it('should handle empty targets array', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await repository.getUserVotesForTargets('user-1', 'POST', []);

      expect(result.size).toBe(0);
      expect(mockPrisma.vote.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          targetType: 'POST',
          targetId: { in: [] },
        },
        select: {
          targetId: true,
          value: true,
        },
      });
    });
  });
});
