import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeployEvents, createDeployEvent } from '@/lib/owner/changelog';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deployEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Changelog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDeployEvents', () => {
    it('returns deploy events ordered by deployedAt desc', async () => {
      const events = [
        { id: 'e1', version: 'v1.0', gitCommit: 'abc', changesSummary: null, status: 'SUCCESS', environment: 'PRODUCTION', deployedAt: new Date(), metadata: null },
      ];
      vi.mocked(prisma.deployEvent.findMany).mockResolvedValue(events as never);
      const result = await getDeployEvents(10);
      expect(result).toEqual(events);
      expect(prisma.deployEvent.findMany).toHaveBeenCalledWith({
        orderBy: { deployedAt: 'desc' },
        take: 10,
      });
    });

    it('uses custom limit', async () => {
      vi.mocked(prisma.deployEvent.findMany).mockResolvedValue([]);
      await getDeployEvents(50);
      expect(prisma.deployEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('createDeployEvent', () => {
    it('creates event with required fields', async () => {
      vi.mocked(prisma.deployEvent.create).mockResolvedValue({
        id: 'de1',
        version: 'v2.0',
        gitCommit: null,
        changesSummary: null,
        status: 'SUCCESS',
        environment: 'PRODUCTION',
        deployedAt: new Date(),
        metadata: null,
      } as never);
      await createDeployEvent({ version: 'v2.0', status: 'SUCCESS' });
      expect(prisma.deployEvent.create).toHaveBeenCalledWith({
        data: {
          version: 'v2.0',
          gitCommit: null,
          changesSummary: null,
          status: 'SUCCESS',
          environment: 'PRODUCTION',
        },
      });
    });

    it('includes optional gitCommit and changesSummary', async () => {
      vi.mocked(prisma.deployEvent.create).mockResolvedValue({} as never);
      await createDeployEvent({
        version: 'v2.1',
        gitCommit: 'abc123',
        changesSummary: 'Fixed bug',
        status: 'SUCCESS',
      });
      expect(prisma.deployEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gitCommit: 'abc123',
          changesSummary: 'Fixed bug',
        }),
      });
    });
  });
});
