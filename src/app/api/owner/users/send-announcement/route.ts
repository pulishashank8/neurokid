import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

/**
 * Send announcement email to users
 * POST /api/owner/users/send-announcement
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, targetRole } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    console.log('[Send Announcement] Fetching users for role:', targetRole);

    // Build where clause based on target role
    let whereClause: any = {
      emailVerified: { not: null }, // Only send to verified emails
      isBanned: false, // Don't send to banned users
    };

    if (targetRole !== 'ALL') {
      whereClause.userRoles = {
        some: {
          role: targetRole,
        },
      };
    }

    // Fetch target users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    console.log(`[Send Announcement] Found ${users.length} users to send to`);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the criteria' },
        { status: 404 }
      );
    }

    // Send emails (in production, use a queue for large batches)
    const emailPromises = users.map((user) => {
      const displayName = user.profile?.displayName || 'NeuroKind User';
      
      return sendEmail({
        to: user.email,
        subject: `[NeuroKind] ${subject}`,
        text: `Hi ${displayName},\n\n${message}\n\n---\nThis is an official announcement from NeuroKind.\nYou're receiving this because you're a registered user of our platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">NeuroKind Announcement</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${displayName}</strong>,</p>
              <div style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5;">
                This is an official announcement from NeuroKind.<br>
                You're receiving this because you're a registered user of our platform.
              </p>
              <p style="color: #9ca3af; font-size: 14px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit NeuroKind</a>
              </p>
            </div>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Send Announcement] Failed to send to ${user.email}:`, err);
        return null; // Don't fail the entire batch
      });
    });

    await Promise.all(emailPromises);

    console.log('[Send Announcement] All emails sent successfully');

    return NextResponse.json({
      success: true,
      recipientCount: users.length,
      message: `Announcement sent to ${users.length} users`,
    });
  } catch (error: any) {
    console.error('[Send Announcement] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send announcement', details: error.message },
      { status: 500 }
    );
  }
}
