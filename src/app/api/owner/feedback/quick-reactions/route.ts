/**
 * GET /api/owner/feedback/quick-reactions
 * Quick reaction averages per feature/category - Pillar 20
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getQuickReactionAverages } from '@/lib/owner/feedback';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hours = Number.parseInt(searchParams.get('hours') || '720', 10); // default 30 days
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await getQuickReactionAverages({ since });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[owner/feedback/quick-reactions]', err);
    return NextResponse.json(
      { error: 'Failed to fetch quick reaction averages' },
      { status: 500 }
    );
  }
}
