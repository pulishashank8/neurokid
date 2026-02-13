import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getCostsByMonth,
  addCost,
  setCost,
  COST_CATEGORIES,
  type CostCategory,
} from '@/lib/owner/cost-tracker';
import { startOfMonth } from 'date-fns';

/** GET /api/owner/costs — List costs by month */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthsBack = Math.min(24, Math.max(1, parseInt(searchParams.get('months') ?? '12', 10)));
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) as
      | CostCategory[]
      | undefined;

    const costs = await getCostsByMonth({
      monthsBack,
      categories,
    });

    return NextResponse.json({
      costs,
      categories: COST_CATEGORIES,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Costs] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costs', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}

/** POST /api/owner/costs — Add or set cost */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      category,
      amount,
      month,
      description,
      currency,
      mode = 'add',
    } = body as {
      category: string;
      amount: number;
      month?: string;
      description?: string;
      currency?: string;
      mode?: 'add' | 'set';
    };

    if (!category || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'category and amount (non-negative) required' },
        { status: 400 }
      );
    }

    if (!COST_CATEGORIES.includes(category as CostCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${COST_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const monthDate = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(monthDate);

    const result =
      mode === 'set'
        ? await setCost({
            category: category as CostCategory,
            amount,
            month: monthStart,
            description,
            currency,
          })
        : await addCost({
            category: category as CostCategory,
            amount,
            month: monthStart,
            description,
            currency,
          });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Costs] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save cost', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
