/**
 * User Lifecycle Stage tracking
 * New -> Activated -> Engaged -> Power User / At Risk / Churned
 */
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function runLifecycleCalculation(): Promise<void> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: {
      id: true,
      createdAt: true,
      lastLoginAt: true,
      lastActiveAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          aiConversations: true,
          screeningResults: true,
        },
      },
    },
  });

  for (const u of users) {
    const lastActivity = u.lastActiveAt ?? u.lastLoginAt ?? u.createdAt;
    const coreFeaturesUsed =
      (u._count.posts > 0 ? 1 : 0) +
      (u._count.comments > 0 ? 1 : 0) +
      (u._count.aiConversations > 0 ? 1 : 0) +
      (u._count.screeningResults > 0 ? 1 : 0);

    let stage = 'New';
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity >= 30) {
      stage = 'Churned';
    } else if (daysSinceActivity >= 7) {
      stage = 'At Risk';
    } else if (coreFeaturesUsed >= 2 && daysSinceActivity < 7) {
      const totalActions = u._count.posts + u._count.comments + u._count.aiConversations;
      stage = totalActions > 20 ? 'Power User' : 'Engaged';
    } else if (coreFeaturesUsed >= 2) {
      stage = 'Activated';
    } else if (daysSinceActivity < 7) {
      stage = 'Engaged';
    }

    await prisma.userLifecycleStage.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        stage,
        lastActivityAt: lastActivity,
        updatedAt: now,
      },
      update: {
        stage,
        lastActivityAt: lastActivity,
        updatedAt: now,
      },
    });
  }
}
