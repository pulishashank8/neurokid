import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { dataGovernanceService } from '@/services/dataGovernanceService';
import { subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const last30d = subDays(new Date(), 30);

    const [
      accessLogs,
      moderationLogs,
      dataRequests,
      consentCount,
      retentionStats,
    ] = await Promise.all([
      prisma.sensitiveAccessLog.findMany({
        take: 50,
        orderBy: { accessedAt: 'desc' },
        include: { adminUser: { select: { email: true } } },
      }),
      prisma.moderationActionLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataRequest.findMany({
        where: { createdAt: { gte: last30d } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.userConsent.count({ where: { hasGranted: true } }),
      dataGovernanceService.getDataRetentionStats(),
    ]);

    const exportRequests = await prisma.dataRequest.count({
      where: { requestType: 'export', status: 'completed' },
    });
    const deleteRequests = await prisma.dataRequest.count({
      where: { requestType: 'delete' },
    });

    return NextResponse.json({
      sensitiveAccessLogs: accessLogs.map((l) => ({
        id: l.id,
        adminEmail: l.adminUser?.email,
        datasetName: l.datasetName,
        actionType: l.actionType,
        accessedAt: l.accessedAt,
      })),
      adminActionsAudit: moderationLogs,
      dataExportRequests: exportRequests,
      dataDeleteRequests: deleteRequests,
      dataRequests: dataRequests.map((r) => ({
        id: r.id,
        requestType: r.requestType,
        status: r.status,
        createdAt: r.createdAt,
      })),
      consentRecordsCount: consentCount,
      retentionStats,
    });
  } catch (error) {
    console.error('[Governance] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch governance data' }, { status: 500 });
  }
}
