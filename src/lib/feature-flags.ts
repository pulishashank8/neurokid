/**
 * Feature Flags - Pillar 24
 * DB-backed flag evaluation with percentage rollout and user/role targeting
 */
import { prisma } from '@/lib/prisma';

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + (userId.codePointAt(i) ?? 0);
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

export async function evaluateFeatureFlag(
  key: string,
  options?: { userId?: string; role?: string }
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return false;
  if (!flag.isEnabled) return false;

  // Target specific user IDs
  const targetIds = flag.targetUserIds as string[] | null;
  if (targetIds?.length && options?.userId) {
    if (targetIds.includes(options.userId)) return true;
  }

  // Target roles
  const targetRoles = flag.targetRoles as string[] | null;
  if (targetRoles?.length && options?.role) {
    if (targetRoles.includes(options.role)) return true;
  }

  // Percentage rollout
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0) return false;
  if (options?.userId) {
    const hash = hashUserId(options.userId);
    return hash < flag.rolloutPercent;
  }

  return flag.rolloutPercent >= 50; // No userId: treat as 50% threshold
}

export async function getAllFlagsForClient(userId?: string, role?: string): Promise<Record<string, boolean>> {
  const flags = await prisma.featureFlag.findMany({
    where: {},
    select: { key: true, isEnabled: true, rolloutPercent: true, targetUserIds: true, targetRoles: true },
  });
  const result: Record<string, boolean> = {};
  for (const f of flags) {
    result[f.key] = await evaluateFeatureFlag(f.key, { userId, role });
  }
  return result;
}
