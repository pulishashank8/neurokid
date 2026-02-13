import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

/**
 * Backfill AIUsageLog from completed AIJobs that don't have a log yet.
 * Covers up to 365 days. Story = storytelling, ephemeral support = ai_chat.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = typeof request.url === 'string' ? request.url : 'http://localhost';
    const { searchParams } = new URL(url);
    const daysParam = searchParams.get('days');
    const days = Math.min(Math.max(Number.parseInt(daysParam || '365', 10) || 365, 7), 365);
    const since = subDays(new Date(), days);

    const completedJobs = await prisma.aIJob.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: since },
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { id: true, userId: true, conversationId: true, startedAt: true, completedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const existingJobIds = new Set(
      (await prisma.aIUsageLog.findMany({
        where: { aiJobId: { not: null } },
        select: { aiJobId: true },
      }))
        .map((l) => l.aiJobId)
        .filter(Boolean) as string[]
    );

    let created = 0;
    for (const job of completedJobs) {
      if (existingJobIds.has(job.id)) continue;

      const responseTimeMs =
        job.startedAt && job.completedAt
          ? job.completedAt.getTime() - job.startedAt.getTime()
          : null;

      const feature = job.conversationId.startsWith('ephemeral_') ? 'ai_chat' : 'storytelling';

      try {
        await prisma.aIUsageLog.create({
          data: {
            aiJobId: job.id,
            userId: job.userId,
            feature,
            status: 'success',
            tokensUsed: null,
            responseTimeMs,
          },
        });
        created++;
        existingJobIds.add(job.id);
      } catch (err) {
        console.error('[AI Usage Backfill] Skip job', job.id, err);
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      totalProcessed: completedJobs.length,
      daysCovered: days,
      message: `Backfilled ${created} AI usage records from ${completedJobs.length} completed jobs (last ${days} days).`,
    });
  } catch (error) {
    console.error('[AI Usage Backfill] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
