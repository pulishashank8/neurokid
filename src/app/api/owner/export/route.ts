import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { format, subDays, startOfDay } from 'date-fns';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { getKpis } from '@/lib/owner/kpis';

function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd HH:mm:ss');
      }
      return String(value);
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function serializeRow(row: Record<string, unknown>, columns: string[]): (string | number | boolean | null)[] {
  return columns.map(col => {
    const v = row[col];
    if (v == null) return null;
    if (v instanceof Date) return format(v, 'yyyy-MM-dd HH:mm:ss');
    if (typeof v === 'object') return JSON.stringify(v);
    return v as string | number | boolean;
  });
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let data: Record<string, unknown>[];
    let columns: string[];
    let filename: string;

    switch (type) {
      case 'users': {
        const users = await prisma.user.findMany({
          include: { profile: true, userRoles: true, _count: { select: { posts: true, comments: true } } },
          orderBy: { createdAt: 'desc' },
        });
        data = users.map(u => ({
          id: u.id,
          email: u.email,
          username: u.profile?.username || '',
          displayName: u.profile?.displayName || '',
          emailVerified: u.emailVerified,
          isBanned: u.isBanned,
          roles: u.userRoles.map(r => r.role).join(';'),
          postsCount: u._count.posts,
          commentsCount: u._count.comments,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt || '',
        }));
        columns = ['id', 'email', 'username', 'displayName', 'emailVerified', 'isBanned', 'roles', 'postsCount', 'commentsCount', 'createdAt', 'lastLoginAt'];
        filename = `users-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'activity': {
        const logs = await prisma.auditLog.findMany({
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        data = logs.map(l => ({
          id: l.id,
          userId: l.userId,
          userEmail: l.user.email,
          username: l.user.profile?.username || '',
          action: l.action,
          targetType: l.targetType || '',
          targetId: l.targetId || '',
          ipAddress: l.ipAddress || '',
          createdAt: l.createdAt,
        }));
        columns = ['id', 'userId', 'userEmail', 'username', 'action', 'targetType', 'targetId', 'ipAddress', 'createdAt'];
        filename = `activity-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'posts': {
        const posts = await prisma.post.findMany({
          include: { author: { include: { profile: true } }, category: true },
          orderBy: { createdAt: 'desc' },
        });
        data = posts.map(p => ({
          id: p.id,
          title: p.title,
          authorEmail: p.author?.email || 'anonymous',
          authorUsername: p.author?.profile?.username || '',
          category: p.category.name,
          status: p.status,
          viewCount: p.viewCount,
          commentCount: p.commentCount,
          voteScore: p.voteScore,
          createdAt: p.createdAt,
        }));
        columns = ['id', 'title', 'authorEmail', 'authorUsername', 'category', 'status', 'viewCount', 'commentCount', 'voteScore', 'createdAt'];
        filename = `posts-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'messages': {
        const messages = await prisma.message.findMany({
          include: { sender: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        data = messages.map(m => ({
          id: m.id,
          senderEmail: m.sender?.email || '',
          contentLength: m.content?.length || 0,
          createdAt: m.createdAt,
        }));
        columns = ['id', 'senderEmail', 'contentLength', 'createdAt'];
        filename = `messages-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'reports': {
        const reports = await prisma.report.findMany({
          include: { reporter: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
        });
        data = reports.map(r => ({
          id: r.id,
          targetType: r.targetType,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status,
          reporter: r.reporter?.profile?.username || r.reporter?.email,
          createdAt: r.createdAt,
        }));
        columns = ['id', 'targetType', 'targetId', 'reason', 'status', 'reporter', 'createdAt'];
        filename = `reports-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'ai-usage': {
        const logs = await prisma.aIUsageLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        data = logs.map(l => ({
          id: l.id,
          userId: l.userId || '',
          feature: l.feature,
          tokensUsed: l.tokensUsed,
          responseTimeMs: l.responseTimeMs,
          status: l.status,
          createdAt: l.createdAt,
        }));
        columns = ['id', 'userId', 'feature', 'tokensUsed', 'responseTimeMs', 'status', 'createdAt'];
        filename = `ai-usage-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'kpi-summary': {
        const kpis = await getKpis();
        data = [{
          exportedAt: new Date(),
          totalUsers: kpis.totalUsers,
          activeUsers7d: kpis.activeUsers7d,
          newSignupsToday: kpis.newSignupsToday,
          totalPosts: kpis.totalPosts,
          totalMessagesSent: kpis.totalMessagesSent,
          dauMauRatio: kpis.dauMauRatio,
          aiUsage7d: (kpis as { aiUsage7d?: number }).aiUsage7d ?? 0,
          ...(kpis.changes as Record<string, number>),
        }];
        columns = Object.keys(data[0] as Record<string, unknown>);
        filename = `kpi-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'safety-report': {
        const [reports, modActions, riskScores] = await Promise.all([
          prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
          prisma.moderationAction.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
          prisma.userRiskScore.findMany({ where: { riskLevel: { in: ['HIGH', 'MEDIUM'] } } }),
        ]);
        const row = (o: Record<string, unknown>) => ({
          type: o.type,
          id: o.id ?? '',
          targetType: o.targetType ?? '',
          reason: o.reason ?? '',
          status: o.status ?? '',
          action: o.action ?? '',
          targetUserId: o.targetUserId ?? '',
          userId: o.userId ?? '',
          score: o.score ?? '',
          riskLevel: o.riskLevel ?? '',
          lastEvaluatedAt: o.lastEvaluatedAt ?? '',
          createdAt: o.createdAt ?? '',
        });
        data = [
          ...reports.map(r => row({ type: 'report', id: r.id, targetType: r.targetType, reason: r.reason, status: r.status, createdAt: r.createdAt })),
          ...modActions.map(m => row({ type: 'moderation', id: m.id, action: m.action, targetUserId: m.targetUserId, createdAt: m.createdAt })),
          ...riskScores.map(rs => row({ type: 'risk', userId: rs.userId, score: rs.score, riskLevel: rs.riskLevel, lastEvaluatedAt: rs.lastEvaluatedAt })),
        ];
        columns = ['type', 'id', 'targetType', 'reason', 'status', 'action', 'targetUserId', 'userId', 'score', 'riskLevel', 'lastEvaluatedAt', 'createdAt'];
        filename = `safety-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      case 'growth-trends': {
        const days = 30;
        const startDate = startOfDay(subDays(new Date(), days));
        const users = await prisma.user.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        });
        const dailySignups: Record<string, number> = {};
        for (let i = 0; i <= days; i++) {
          const d = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
          dailySignups[d] = 0;
        }
        users.forEach(u => {
          const d = format(u.createdAt, 'yyyy-MM-dd');
          if (dailySignups[d] !== undefined) dailySignups[d]++;
        });
        data = Object.entries(dailySignups).map(([date, count]) => ({ date, dailySignups: count }));
        columns = ['date', 'dailySignups'];
        filename = `growth-trends-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    const fmt = request.nextUrl.searchParams.get('format') || 'xlsx';
    if (fmt === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const colW = pageW / columns.length;
      let y = 15;
      doc.setFontSize(10);
      columns.forEach((col, i) => {
        doc.text(col, 10 + i * colW, y);
      });
      y += 8;
      const rows = data.slice(0, 50).map((row) =>
        columns.map((col) => {
          const v = row[col];
          if (v == null) return '';
          if (v instanceof Date) return format(v, 'yyyy-MM-dd');
          return String(v).slice(0, 30);
        })
      );
      rows.forEach((row) => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        row.forEach((cell, i) => {
          doc.text(cell, 10 + i * colW, y);
        });
        y += 6;
      });
      const buffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename.replace('.xlsx', '.pdf')}"`,
        },
      });
    }
    if (fmt === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Export');
      sheet.addRow(columns);
      for (const row of data) {
        sheet.addRow(serializeRow(row as Record<string, unknown>, columns));
      }
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return new NextResponse(toCSV(data, columns), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename.replace('.xlsx', '.csv')}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
