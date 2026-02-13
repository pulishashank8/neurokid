/**
 * Automation Action Executors
 * Performs the actual actions when automation rules trigger
 */

import { prisma } from '@/lib/prisma';
import { createAdminNotification } from '@/lib/owner/create-admin-notification';
import { logModerationAction } from '@/lib/owner/moderation-log';
import { addHours } from 'date-fns';
import { isRedisEnabled } from '@/lib/redis';

const OWNER_ADMIN_ID = 'owner';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.neurokid.help';

/** Send a transactional email (Resend) */
async function sendAutomationEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  const { Resend } = await import('resend');
  const emailFrom = (process.env.EMAIL_FROM || 'onboarding@resend.dev').replaceAll(/[<>]/g, '');
  const resend = new Resend(resendApiKey);

  try {
    await resend.emails.send({
      from: `NeuroKid <${emailFrom}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[Automation] Email send error:', error);
    throw error;
  }
}

/** Re-engagement email for at-risk users */
export async function sendReEngagementEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;

  const html = `
    <!DOCTYPE html><html><body style="font-family:sans-serif;max-width:570px;margin:0 auto;padding:40px;">
      <h1>We miss you!</h1>
      <p>Hi there,</p>
      <p>It's been a while since we've seen you on NeuroKid. Our community of parents is here whenever you need support.</p>
      <p><a href="${appUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Visit NeuroKid</a></p>
      <p>© ${new Date().getFullYear()} NeuroKid.</p>
    </body></html>
  `;
  await sendAutomationEmail(user.email, "We'd love to see you back on NeuroKid", html);
}

/** Welcome email for new signups */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;

  const html = `
    <!DOCTYPE html><html><body style="font-family:sans-serif;max-width:570px;margin:0 auto;padding:40px;">
      <h1>Welcome to NeuroKid!</h1>
      <p>Hi there,</p>
      <p>Thanks for joining our community. Explore stories, connect with other parents, and find support.</p>
      <p><a href="${appUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Get Started</a></p>
      <p>© ${new Date().getFullYear()} NeuroKid.</p>
    </body></html>
  `;
  await sendAutomationEmail(user.email, 'Welcome to NeuroKid!', html);
}

/** Temp-block user for 24h (3+ reports rule) */
export async function tempBlockUser24h(userId: string, reason: string): Promise<void> {
  const expires = addHours(new Date(), 24);
  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      bannedAt: new Date(),
      bannedUntil: expires,
      bannedReason: reason,
    },
  });
  await logModerationAction({
    actionType: 'TEMP_BAN',
    targetType: 'user',
    targetId: userId,
    reason: `Automation: ${reason}`,
    metadata: { expiresAt: expires.toISOString() },
  });
}

/** Shadowban user (profile-level) */
export async function shadowbanUser(userId: string, reason: string): Promise<void> {
  await prisma.profile.updateMany({
    where: { userId },
    data: { shadowbanned: true, shadowbannedAt: new Date() },
  });
  await logModerationAction({
    actionType: 'SHADOWBAN',
    targetType: 'user',
    targetId: userId,
    reason: `Automation: ${reason}`,
  });
}

/** Block IP for 1 hour (store in Redis) */
export async function blockIp1h(ip: string): Promise<void> {
  if (!isRedisEnabled()) return;
  try {
    const { redis } = await import('@/lib/redis');
    if (redis) await redis.setex(`blocked_ip:${ip}`, 3600, '1'); // 1h TTL
  } catch (e) {
    console.error('[Automation] Redis IP block failed:', e);
  }
}

/** Pin a post */
export async function pinPost(postId: string, reason: string): Promise<void> {
  await prisma.post.update({
    where: { id: postId },
    data: { isPinned: true, pinnedAt: new Date() },
  });
  await logModerationAction({
    actionType: 'PIN',
    targetType: 'post',
    targetId: postId,
    reason: `Automation: ${reason}`,
  });
}

/** Send congratulations email (e.g. 10 posts milestone) */
export async function sendCongratsEmail(userId: string, reason: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;

  const html = `
    <!DOCTYPE html><html><body style="font-family:sans-serif;max-width:570px;margin:0 auto;padding:40px;">
      <h1>Congrats!</h1>
      <p>Hi there,</p>
      <p>${reason}</p>
      <p>Thank you for being part of the NeuroKid community.</p>
      <p>© ${new Date().getFullYear()} NeuroKid.</p>
    </body></html>
  `;
  await sendAutomationEmail(user.email, 'Congratulations from NeuroKid', html);
}

/** Notify owner (admin notification) */
export async function notifyOwner(severity: 'info' | 'warning' | 'critical', message: string, metadata?: Record<string, unknown>): Promise<void> {
  await createAdminNotification({
    type: 'AUTOMATION_ALERT',
    severity,
    message,
    metadata,
  });
}
