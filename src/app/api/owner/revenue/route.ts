import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getRevenueByMonth,
  addRevenue,
  computeRunway,
  REVENUE_SOURCES,
  type RevenueSource,
} from '@/lib/owner/revenue-tracker';
import { prisma } from '@/lib/prisma';
import { startOfMonth } from 'date-fns';

/** GET /api/owner/revenue — List revenue by month, or runway */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') ?? 'list'; // list | runway
    const monthsBack = Math.min(24, Math.max(1, parseInt(searchParams.get('months') ?? '12', 10)));
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) as
      | RevenueSource[]
      | undefined;
    const cashReserves = parseFloat(searchParams.get('cashReserves') ?? '0');

    if (mode === 'runway') {
      const runway = await computeRunway({ cashReserves });
      return NextResponse.json({ runway });
    }

    const revenue = await getRevenueByMonth({
      monthsBack,
      sources,
    });

    return NextResponse.json({
      revenue,
      sources: REVENUE_SOURCES,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Revenue] GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch revenue',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
      },
      { status: 500 }
    );
  }
}

/** POST /api/owner/revenue — Add revenue entry */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { source, amount, month, description, stripeId, currency } = body as {
      source: string;
      amount: number;
      month?: string;
      description?: string;
      stripeId?: string;
      currency?: string;
    };

    if (!source || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'source and amount (non-negative) required' },
        { status: 400 }
      );
    }

    if (!REVENUE_SOURCES.includes(source as RevenueSource)) {
      return NextResponse.json(
        { error: `Invalid source. Allowed: ${REVENUE_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    const monthDate = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(monthDate);

    const result = await addRevenue({
      source: source as RevenueSource,
      amount,
      month: monthStart,
      description,
      stripeId,
      currency,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Revenue] POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save revenue',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
      },
      { status: 500 }
    );
  }
}

/** DELETE /api/owner/revenue — Delete revenue entry */
export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await prisma.revenueEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Revenue] DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete revenue entry',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
      },
      { status: 500 }
    );
  }
}
