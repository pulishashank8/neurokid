/**
 * Changelog & Version Tracking - Pillar 25
 */
import { prisma } from '@/lib/prisma';

export async function getDeployEvents(limit = 20) {
  return prisma.deployEvent.findMany({
    orderBy: { deployedAt: 'desc' },
    take: limit,
  });
}

export async function createDeployEvent(data: {
  version: string;
  gitCommit?: string;
  changesSummary?: string;
  status: string;
  environment?: string;
}) {
  return prisma.deployEvent.create({
    data: {
      version: data.version,
      gitCommit: data.gitCommit ?? null,
      changesSummary: data.changesSummary ?? null,
      status: data.status,
      environment: data.environment ?? 'PRODUCTION',
    },
  });
}
