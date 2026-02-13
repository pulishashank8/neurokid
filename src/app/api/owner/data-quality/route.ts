import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = subDays(new Date(), 7);
    const metrics = await prisma.dataQualityMetric.findMany({
      where: { recordedAt: { gte: sevenDaysAgo } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });

    const byName = metrics.reduce(
      (acc, m) => {
        if (!acc[m.metricName]) acc[m.metricName] = [];
        acc[m.metricName].push({ value: m.metricValue, at: m.recordedAt });
        return acc;
      },
      {} as Record<string, { value: number; at: Date }[]>
    );

    const latest = Object.fromEntries(
      Object.entries(byName).map(([k, v]) => [k, v[0]?.value ?? 0])
    );

    return NextResponse.json({
      metrics: latest,
      history: byName,
    });
  } catch (error) {
    console.error('[DataQuality] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data quality' }, { status: 500 });
  }
}
