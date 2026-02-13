/**
 * Feature Flags CRUD - Pillar 24
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ flags });
  } catch (err) {
    console.error('[owner/feature-flags]', err);
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { key, name, description, isEnabled = false, rolloutPercent = 100, targetRoles, targetUserIds } = body;
    if (!key || !name) {
      return NextResponse.json({ error: 'key and name required' }, { status: 400 });
    }
    const flag = await prisma.featureFlag.create({
      data: {
        key: String(key).replace(/\s/g, '_'),
        name: String(name),
        description: description ?? null,
        isEnabled: Boolean(isEnabled),
        rolloutPercent: Math.min(100, Math.max(0, Number(rolloutPercent) || 100)),
        targetRoles: targetRoles ?? null,
        targetUserIds: targetUserIds ?? null,
      },
    });
    return NextResponse.json({ flag });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Flag key already exists' }, { status: 409 });
    }
    console.error('[owner/feature-flags]', err);
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, isEnabled, rolloutPercent, targetRoles, targetUserIds } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof isEnabled === 'boolean') data.isEnabled = isEnabled;
    if (rolloutPercent !== undefined) data.rolloutPercent = Math.min(100, Math.max(0, Number(rolloutPercent)));
    if (targetRoles !== undefined) data.targetRoles = targetRoles;
    if (targetUserIds !== undefined) data.targetUserIds = targetUserIds;

    const flag = await prisma.featureFlag.update({
      where: { id },
      data,
    });
    return NextResponse.json({ flag });
  } catch (err) {
    console.error('[owner/feature-flags]', err);
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.featureFlag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[owner/feature-flags]', err);
    return NextResponse.json({ error: 'Failed to delete flag' }, { status: 500 });
  }
}
