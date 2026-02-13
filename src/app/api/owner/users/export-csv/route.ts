import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Export users to CSV
 * GET /api/owner/users/export-csv
 */
export async function GET() {
  try {
    // Verify admin authentication
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all users with relevant data
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
        userRoles: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            votes: true,
          },
        },
      },
    });

    // Build CSV content
    const headers = [
      'ID',
      'Email',
      'Display Name',
      'Username',
      'Email Verified',
      'Roles',
      'Posts Count',
      'Comments Count',
      'Votes Count',
      'Banned',
      'Ban Reason',
      'Last Login',
      'Created At',
      'Location',
      'Bio',
    ];

    const rows = users.map((user) => [
      user.id,
      user.email,
      user.profile?.displayName || '',
      user.profile?.username || '',
      user.emailVerified ? 'Yes' : 'No',
      user.userRoles.map((r) => r.role).join('; '),
      user._count.posts.toString(),
      user._count.comments.toString(),
      user._count.votes.toString(),
      user.isBanned ? 'Yes' : 'No',
      user.bannedReason || '',
      user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
      user.createdAt.toISOString(),
      user.profile?.location || '',
      user.profile?.bio || '',
    ]);

    // Escape CSV fields (handle commas, quotes, newlines)
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[Export CSV] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV', details: error.message },
      { status: 500 }
    );
  }
}
