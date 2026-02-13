import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { startOfDay, subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = startOfDay(new Date());
    const last7d = subDays(today, 7);

    const [
      postsToday,
      commentsToday,
      reportsSubmitted,
      openReports,
      warnedBannedCount,
      reportedPosts,
      reportedComments,
      violations,
    ] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gte: today } } }),
      prisma.comment.count({ where: { createdAt: { gte: today } } }),
      prisma.report.count({ where: { createdAt: { gte: last7d } } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.moderationAction.count({
        where: {
          action: { in: ['WARN', 'REMOVE'] },
          targetUserId: { not: null },
          createdAt: { gte: last7d },
        },
      }),
      prisma.report.findMany({
        where: { targetType: 'POST' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, email: true, profile: { select: { username: true } } } },
        },
      }),
      prisma.report.findMany({
        where: { targetType: 'COMMENT' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, email: true, profile: { select: { username: true } } } },
        },
      }),
      prisma.moderationAction.findMany({
        where: { targetUserId: { not: null } },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          targetUser: { select: { id: true, email: true, profile: { select: { username: true } } } },
        },
      }),
    ]);

    const bannedUsers = await prisma.user.count({ where: { isBanned: true } });

    const postIds = [...new Set(reportedPosts.map((r) => r.targetId))];
    const commentIds = [...new Set(reportedComments.map((r) => r.targetId))];
    const [postsList, commentsList] = await Promise.all([
      postIds.length ? prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, status: true, isLocked: true, isPinned: true, authorId: true } }) : [],
      commentIds.length ? prisma.comment.findMany({ where: { id: { in: commentIds } }, select: { id: true, status: true, authorId: true } }) : [],
    ]);
    const postsById = Object.fromEntries(postsList.map((p) => [p.id, p]));
    const commentsById = Object.fromEntries(commentsList.map((c) => [c.id, c]));

    return NextResponse.json({
      metrics: {
        postsToday,
        commentsToday,
        reportsSubmitted,
        flaggedContent: openReports,
        usersWarnedBanned: warnedBannedCount,
        bannedUsers,
      },
      reportedPosts: reportedPosts.map((r) => {
        const post = postsById[r.targetId];
        return {
          id: r.id,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          reporter: r.reporter?.profile?.username || r.reporter?.email,
          postStatus: post?.status,
          isLocked: post?.isLocked,
          isPinned: post?.isPinned,
          authorId: post?.authorId,
        };
      }),
      reportedComments: reportedComments.map((r) => {
        const comment = commentsById[r.targetId];
        return {
          id: r.id,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          reporter: r.reporter?.profile?.username || r.reporter?.email,
          commentStatus: comment?.status,
          authorId: comment?.authorId,
        };
      }),
      violations: violations.map((v) => ({
        id: v.id,
        action: v.action,
        targetUserId: v.targetUserId,
        targetUser: v.targetUser?.profile?.username || v.targetUser?.email,
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Moderation] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch moderation data' }, { status: 500 });
  }
}
