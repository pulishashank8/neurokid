/**
 * GET /api/owner/backups - Backup status
 * POST - Record manual backup event
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getBackupStatus, recordBackupEvent } from '@/lib/owner/backup-monitor';

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const status = await getBackupStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error('[owner/backups]', err);
    return NextResponse.json({ error: 'Failed to fetch backup status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { backupType = 'MANUAL', status = 'SUCCESS', sizeBytes, provider } = body;
    const event = await recordBackupEvent({
      backupType,
      status,
      sizeBytes: sizeBytes ? BigInt(sizeBytes) : undefined,
      provider,
    });
    return NextResponse.json({ event });
  } catch (err) {
    console.error('[owner/backups]', err);
    return NextResponse.json({ error: 'Failed to record backup' }, { status: 500 });
  }
}
