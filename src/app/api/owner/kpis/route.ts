import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getKpis } from '@/lib/owner/kpis';

export async function GET(request: NextRequest) {
  try {
    // Check admin session cookie authentication
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kpis = await getKpis();
    return NextResponse.json(kpis);
  } catch (error) {
    console.error('[KPIs API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
