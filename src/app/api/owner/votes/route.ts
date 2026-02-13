import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const type = url.searchParams.get('type') || '';
    const pageSize = 30;
    const skip = (page - 1) * pageSize;

    const where = type && (type === 'POST' || type === 'COMMENT')
      ? { targetType: type as 'POST' | 'COMMENT' }
      : {};

    const [votes, total, stats] = await Promise.all([
      prisma.vote.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            include: { profile: true },
          },
        },
      }),
      prisma.vote.count({ where }),
      prisma.vote.groupBy({
        by: ['targetType', 'value'],
        _count: true,
      }),
    ]);

    const postUpvotes = stats.find(s => s.targetType === 'POST' && s.value === 1)?._count || 0;
    const postDownvotes = stats.find(s => s.targetType === 'POST' && s.value === -1)?._count || 0;
    const commentUpvotes = stats.find(s => s.targetType === 'COMMENT' && s.value === 1)?._count || 0;
    const commentDownvotes = stats.find(s => s.targetType === 'COMMENT' && s.value === -1)?._count || 0;

    return NextResponse.json({
      votes,
      total,
      pageSize,
      page,
      postUpvotes,
      postDownvotes,
      commentUpvotes,
      commentDownvotes,
    });
  } catch (error) {
    console.error('[Votes API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
