import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateFeatureFlag, getAllFlagsForClient } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateFeatureFlag', () => {
    it('returns false when flag does not exist', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null);
      const result = await evaluateFeatureFlag('nonexistent');
      expect(result).toBe(false);
    });

    it('returns false when flag is disabled', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: 'f1',
        key: 'test',
        name: 'Test',
        description: null,
        isEnabled: false,
        rolloutPercent: 100,
        targetUserIds: null,
        targetRoles: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await evaluateFeatureFlag('test');
      expect(result).toBe(false);
    });

    it('returns true when enabled with 100% rollout', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: 'f1',
        key: 'test',
        name: 'Test',
        description: null,
        isEnabled: true,
        rolloutPercent: 100,
        targetUserIds: null,
        targetRoles: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await evaluateFeatureFlag('test');
      expect(result).toBe(true);
    });

    it('returns true when user ID in targetUserIds', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: 'f1',
        key: 'test',
        name: 'Test',
        description: null,
        isEnabled: true,
        rolloutPercent: 0,
        targetUserIds: ['user-123'],
        targetRoles: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await evaluateFeatureFlag('test', { userId: 'user-123' });
      expect(result).toBe(true);
    });

    it('returns true when role in targetRoles', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: 'f1',
        key: 'test',
        name: 'Test',
        description: null,
        isEnabled: true,
        rolloutPercent: 0,
        targetUserIds: null,
        targetRoles: ['PARENT'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await evaluateFeatureFlag('test', { role: 'PARENT' });
      expect(result).toBe(true);
    });
  });

  describe('getAllFlagsForClient', () => {
    it('returns empty object when no flags', async () => {
      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([]);
      const result = await getAllFlagsForClient();
      expect(result).toEqual({});
    });

    it('returns evaluated flags for each key', async () => {
      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([
        { key: 'a', isEnabled: true, rolloutPercent: 100, targetUserIds: null, targetRoles: null },
        { key: 'b', isEnabled: false, rolloutPercent: 0, targetUserIds: null, targetRoles: null },
      ] as never);
      vi.mocked(prisma.featureFlag.findUnique)
        .mockResolvedValueOnce({
          id: 'f1', key: 'a', isEnabled: true, rolloutPercent: 100, targetUserIds: null, targetRoles: null,
          name: '', description: null, createdAt: new Date(), updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'f2', key: 'b', isEnabled: false, rolloutPercent: 0, targetUserIds: null, targetRoles: null,
          name: '', description: null, createdAt: new Date(), updatedAt: new Date(),
        });
      const result = await getAllFlagsForClient();
      expect(result).toHaveProperty('a', true);
      expect(result).toHaveProperty('b', false);
    });
  });
});
