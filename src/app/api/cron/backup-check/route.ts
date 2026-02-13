/**
 * Cron: backup-check - Alert if last backup > 36h
 * Schedule: every 6 hours
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackupStatus } from '@/lib/owner/backup-monitor';
import { createAdminNotification } from '@/lib/owner/create-admin-notification';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getBackupStatus();
    if (status.isStale) {
      await createAdminNotification({
        type: 'BACKUP_STALE',
        message: status.lastBackup
          ? `Last backup was ${Math.round((Date.now() - status.lastBackup.createdAt.getTime()) / 3600000)}h ago.`
          : 'No backup events recorded.',
        severity: 'warning',
      });
    }
    return NextResponse.json({ ok: true, isStale: status.isStale });
  } catch (err) {
    console.error('[cron/backup-check]', err);
    return NextResponse.json({ error: 'Backup check failed' }, { status: 500 });
  }
}
