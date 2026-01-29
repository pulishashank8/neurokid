/**
 * User Data Audit API (GDPR/CCPA Compliance)
 *
 * Allows admin to:
 * - Export all user data for a given email/ID
 * - View what data is stored for a user
 * - Support data portability requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: email ? { email: { equals: email, mode: 'insensitive' } } : { id: userId },
      include: {
        profile: true,
        userRoles: true,
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: true,
            isAnonymous: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        votes: {
          select: {
            id: true,
            value: true,
            createdAt: true,
          },
        },
        bookmarks: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        notifications: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            readAt: true,
          },
        },
        screeningResults: {
          select: {
            id: true,
            screeningType: true,
            riskLevel: true,
            completedAt: true,
          },
        },
        therapySessions: {
          select: {
            id: true,
            sessionDate: true,
            notes: true,
          },
        },
        emergencyCards: {
          select: {
            id: true,
            childName: true,
            createdAt: true,
          },
        },
        aiConversations: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            messages: {
              select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
        userConsents: {
          select: {
            id: true,
            consentType: true,
            hasGranted: true,
            grantedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the audit action
    await prisma.sensitiveAccessLog.create({
      data: {
        adminUserId: 'system', // In production, get from session
        actionType: 'AUDIT',
        datasetName: 'UserData',
        recordCount: 1,
        reason: `GDPR/CCPA data audit request for user: ${user.email}`,
      },
    });

    // Build audit report
    const auditReport = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      accountCreated: user.createdAt,
      lastLogin: user.lastLoginAt,
      emailVerified: user.emailVerified,

      profile: user.profile
        ? {
            username: user.profile.username,
            displayName: user.profile.displayName,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,

      roles: user.userRoles.map((r) => r.role),

      dataSummary: {
        posts: user.posts.length,
        comments: user.comments.length,
        votes: user.votes.length,
        bookmarks: user.bookmarks.length,
        notifications: user.notifications.length,
        screenings: user.screeningResults.length,
        therapySessions: user.therapySessions.length,
        emergencyCards: user.emergencyCards.length,
        aiConversations: user.aiConversations.length,
        consents: user.userConsents.length,
      },

      consents: user.userConsents,

      sensitiveData: {
        screeningResults: user.screeningResults.map((s) => ({
          type: s.screeningType,
          riskLevel: s.riskLevel,
          date: s.completedAt,
        })),
        therapySessions: user.therapySessions.map((t) => ({
          date: t.sessionDate,
          hasNotes: !!t.notes,
        })),
        emergencyCards: user.emergencyCards.map((e) => ({
          childName: e.childName,
          created: e.createdAt,
        })),
      },

      activityData: {
        recentPosts: user.posts.slice(0, 10),
        recentComments: user.comments.slice(0, 10),
        aiConversations: user.aiConversations.map((c) => ({
          title: c.title,
          messageCount: c.messages.length,
          created: c.createdAt,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      data: auditReport,
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}
