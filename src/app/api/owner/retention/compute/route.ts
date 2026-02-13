import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runRetentionCalculation } from '@/lib/owner/retention';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runRetentionCalculation();
    return NextResponse.json({ ok: true, message: 'Retention calculated' });
  } catch (error) {
    console.error('[Retention] Compute error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    const hint =
      /does not exist|relation.*not found|P2021|UserRetentionSnapshot/i.test(msg)
        ? 'Run: npx prisma migrate deploy'
        : undefined;
    return NextResponse.json(
      {
        error: 'Failed to compute retention',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        hint,
      },
      { status: 500 }
    );
  }
}
