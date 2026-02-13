import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GDPR Data Export API
 * Allows users to export all their personal data in JSON format
 * Complies with GDPR Article 20 (Right to data portability)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization check - users can only export their own data (or owner can export any)
    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.user.id },
      select: { role: true },
    });
    const isOwner = userRoles?.some((r) => r.role === 'OWNER') ?? false;
    const isSelf = session.user.id === userId;

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: 'Forbidden - You can only export your own data' },
        { status: 403 }
      );
    }

    // Fetch user and validate existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRoles: { select: { role: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all user-generated content (schema-aligned)
    const [posts, comments, votes, reports, feedback, sessions, bookmarks, consents] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          content: true,
          category: { select: { name: true } },
          status: true,
          isAnonymous: true,
          viewCount: true,
          voteScore: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.comment.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          content: true,
          postId: true,
          status: true,
          isAnonymous: true,
          voteScore: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.vote.findMany({
        where: { userId },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          value: true,
          createdAt: true,
        },
      }),
      prisma.report.findMany({
        where: { reporterId: userId },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.userFeedback.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          rating: true,
          text: true,
          category: true,
          pagePath: true,
          createdAt: true,
        },
      }),
      prisma.userSession.findMany({
        where: { userId },
        select: {
          id: true,
          lastActiveAt: true,
          createdAt: true,
        },
        orderBy: { lastActiveAt: 'desc' },
        take: 100,
      }),
      prisma.bookmark.findMany({
        where: { userId },
        select: {
          id: true,
          postId: true,
          createdAt: true,
        },
      }),
      prisma.userConsent.findMany({
        where: { userId },
        select: {
          id: true,
          consentType: true,
          version: true,
          hasGranted: true,
          grantedAt: true,
          revokedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Build comprehensive data export
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.id,
        dataSubject: userId,
        exportFormat: 'JSON',
        gdprCompliance: 'GDPR Article 20 - Right to data portability',
      },
      personalInformation: {
        userId: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        lastActiveAt: user.lastActiveAt,
        isBanned: user.isBanned,
        bannedUntil: user.bannedUntil,
        bannedReason: user.bannedReason,
      },
      profile: user.profile
        ? {
            username: user.profile.username,
            displayName: user.profile.displayName,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            location: user.profile.location,
            website: user.profile.website,
            verifiedTherapist: user.profile.verifiedTherapist,
            verifiedAt: user.profile.verifiedAt,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      roles: (user.userRoles ?? []).map((r) => r.role),
      communityActivity: {
        posts: {
          total: posts?.length ?? 0,
          items: (posts ?? []).map((post) => ({
            postId: post.id,
            title: post.title,
            content: post.content,
            category: post.category?.name,
            status: post.status,
            isAnonymous: post.isAnonymous,
            viewCount: post.viewCount,
            voteScore: post.voteScore,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          })),
        },
        comments: {
          total: comments?.length ?? 0,
          items: (comments ?? []).map((comment) => ({
            commentId: comment.id,
            content: comment.content,
            postId: comment.postId,
            status: comment.status,
            isAnonymous: comment.isAnonymous,
            voteScore: comment.voteScore,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          })),
        },
        votes: {
          total: votes?.length ?? 0,
          items: (votes ?? []).map((vote) => ({
            voteId: vote.id,
            targetType: vote.targetType,
            targetId: vote.targetId,
            value: vote.value,
            createdAt: vote.createdAt,
          })),
        },
        reports: {
          total: reports?.length ?? 0,
          items: (reports ?? []).map((r) => ({
            reportId: r.id,
            targetType: r.targetType,
            targetId: r.targetId,
            reason: r.reason,
            description: r.description,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        },
        bookmarks: {
          total: bookmarks?.length ?? 0,
          items: (bookmarks ?? []).map((b) => ({
            bookmarkId: b.id,
            postId: b.postId,
            createdAt: b.createdAt,
          })),
        },
      },
      feedback: {
        total: feedback?.length ?? 0,
        items: (feedback ?? []).map((f) => ({
          feedbackId: f.id,
          type: f.type,
          rating: f.rating,
          text: f.text,
          category: f.category,
          pagePath: f.pagePath,
          createdAt: f.createdAt,
        })),
      },
      sessions: {
        total: sessions?.length ?? 0,
        recentSessions: (sessions ?? []).map((s) => ({
          sessionId: s.id,
          lastActiveAt: s.lastActiveAt,
          createdAt: s.createdAt,
        })),
      },
      consents: {
        total: consents?.length ?? 0,
        items: (consents ?? []).map((c) => ({
          consentId: c.id,
          consentType: c.consentType,
          version: c.version,
          hasGranted: c.hasGranted,
          grantedAt: c.grantedAt,
          revokedAt: c.revokedAt,
          createdAt: c.createdAt,
        })),
      },
      privacySettings: {
        note: 'Privacy settings are managed through the application settings.',
      },
      dataRetentionNotice:
        'You can request deletion of your data at any time. Some data may be retained for legal compliance.',
    };

    // Support ?format=csv for CSV export
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    if (format === 'csv') {
      // Simple CSV: flatten key user data
      const csvRows = [
        ['Field', 'Value'],
        ['userId', userId],
        ['email', user.email],
        ['username', user.profile?.username ?? ''],
        ['displayName', user.profile?.displayName ?? ''],
        ['createdAt', user.createdAt.toISOString()],
        ['posts_count', String(posts.length)],
        ['comments_count', String(comments.length)],
        ['votes_count', String(votes.length)],
      ];
      const csv = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="neurokind-export-${userId}-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON export
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="neurokind-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[GDPR Export Error]', error);
    return NextResponse.json(
      { error: 'Internal server error during data export' },
      { status: 500 }
    );
  }
}
