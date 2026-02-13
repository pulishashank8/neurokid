/**
 * Changelog CRUD - Pillar 25
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getDeployEvents, createDeployEvent } from '@/lib/owner/changelog';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const events = await getDeployEvents(limit);
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[owner/changelog]', err);
    return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { version, gitCommit, changesSummary, status = 'SUCCESS', environment } = body;
    if (!version) return NextResponse.json({ error: 'version required' }, { status: 400 });
    const event = await createDeployEvent({
      version,
      gitCommit,
      changesSummary,
      status,
      environment,
    });
    return NextResponse.json({ event });
  } catch (err) {
    console.error('[owner/changelog]', err);
    return NextResponse.json({ error: 'Failed to create deploy event' }, { status: 500 });
  }
}
