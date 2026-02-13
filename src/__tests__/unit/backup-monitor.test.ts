import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBackupStatus, recordBackupEvent } from '@/lib/owner/backup-monitor';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    backupEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Backup Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBackupStatus', () => {
    it('returns stale when no backup events', async () => {
      vi.mocked(prisma.backupEvent.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await getBackupStatus();
      expect(result.lastBackup).toBeNull();
      expect(result.recoveryPoints).toEqual([]);
      expect(result.backupHealth).toEqual([]);
      expect(result.isStale).toBe(true);
      expect(result.frequency).toBe('Every 24h');
    });

    it('returns last backup and recovery points', async () => {
      const now = new Date();
      const events = [
        { status: 'SUCCESS', createdAt: now, sizeBytes: BigInt(1024) },
      ];
      vi.mocked(prisma.backupEvent.findMany)
        .mockResolvedValueOnce(events as never)
        .mockResolvedValueOnce(events as never);
      const result = await getBackupStatus();
      expect(result.lastBackup).not.toBeNull();
      expect(result.lastBackup?.status).toBe('SUCCESS');
      expect(result.recoveryPoints).toHaveLength(1);
      expect(result.backupHealth).toEqual(['SUCCESS']);
    });

    it('returns isStale true when backup older than 36h', async () => {
      const oldDate = new Date(Date.now() - 40 * 60 * 60 * 1000);
      vi.mocked(prisma.backupEvent.findMany)
        .mockResolvedValueOnce([{ status: 'SUCCESS', createdAt: oldDate, sizeBytes: null }] as never)
        .mockResolvedValueOnce([{ status: 'SUCCESS', createdAt: oldDate }] as never);
      const result = await getBackupStatus();
      expect(result.isStale).toBe(true);
    });
  });

  describe('recordBackupEvent', () => {
    it('creates backup event with defaults', async () => {
      vi.mocked(prisma.backupEvent.create).mockResolvedValue({
        id: 'be1',
        backupType: 'MANUAL',
        status: 'SUCCESS',
        sizeBytes: null,
        provider: 'SUPABASE',
        metadata: null,
        createdAt: new Date(),
      } as never);
      await recordBackupEvent({ backupType: 'MANUAL', status: 'SUCCESS' });
      expect(prisma.backupEvent.create).toHaveBeenCalledWith({
        data: {
          backupType: 'MANUAL',
          status: 'SUCCESS',
          sizeBytes: null,
          provider: 'SUPABASE',
        },
      });
    });

    it('passes sizeBytes when provided', async () => {
      vi.mocked(prisma.backupEvent.create).mockResolvedValue({} as never);
      await recordBackupEvent({ backupType: 'AUTOMATIC', status: 'SUCCESS', sizeBytes: BigInt(5000) });
      expect(prisma.backupEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sizeBytes: BigInt(5000) }),
      });
    });
  });
});
