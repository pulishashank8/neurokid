/**
 * Backup Monitor - Pillar 21
 * Tracks backup events, alerts if backup age > 36h
 */
import { prisma } from '@/lib/prisma';

export interface BackupStatus {
  lastBackup: { createdAt: Date; status: string; sizeBytes?: bigint } | null;
  recoveryPoints: { createdAt: Date; status: string }[];
  backupHealth: ('SUCCESS' | 'FAILED')[];
  isStale: boolean;
  frequency: string;
}

export async function getBackupStatus(): Promise<BackupStatus> {
  const [lastFive, lastSeven] = await Promise.all([
    prisma.backupEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { status: true, createdAt: true, sizeBytes: true },
    }),
    prisma.backupEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { status: true, createdAt: true },
    }),
  ]);

  const lastBackup = lastFive[0] ?? null;
  const backupHealth = lastFive.map((e) => e.status as 'SUCCESS' | 'FAILED');
  const recoveryPoints = lastSeven.map((e) => ({ createdAt: e.createdAt, status: e.status }));
  const staleThresholdMs = 36 * 60 * 60 * 1000;
  const isStale = lastBackup
    ? Date.now() - lastBackup.createdAt.getTime() > staleThresholdMs
    : true;

  return {
    lastBackup: lastBackup
      ? { createdAt: lastBackup.createdAt, status: lastBackup.status, sizeBytes: lastBackup.sizeBytes }
      : null,
    recoveryPoints,
    backupHealth,
    isStale,
    frequency: 'Every 24h',
  };
}

export async function recordBackupEvent(data: {
  backupType: string;
  status: string;
  sizeBytes?: bigint;
  provider?: string;
}) {
  return prisma.backupEvent.create({
    data: {
      backupType: data.backupType,
      status: data.status,
      sizeBytes: data.sizeBytes ?? null,
      provider: data.provider ?? 'SUPABASE',
    },
  });
}
