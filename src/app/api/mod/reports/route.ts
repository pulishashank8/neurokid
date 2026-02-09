import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/rbac";
import { Prisma, ReportStatus, ReportTargetType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = Math.min(parseInt(searchParams.get("take") || "20"), 100);
    const status = searchParams.get("status");
    const targetType = searchParams.get("targetType");

    const where: Prisma.ReportWhereInput = {};
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }
    if (targetType && Object.values(ReportTargetType).includes(targetType as ReportTargetType)) {
      where.targetType = targetType as ReportTargetType;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, profile: { select: { username: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    // Calculate some basic stats if requested (or just return them by default as expected by test)
    const stats = {
      totalReports: total,
      openReports: await prisma.report.count({ where: { status: 'OPEN' } }),
    };

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        targetType: r.targetType,
        targetId: r.targetId,
        status: r.status,
        createdAt: r.createdAt,
        reporter: r.reporter ? { id: r.reporter.id, username: r.reporter.profile?.username ?? null } : null,
      })),
      total,
      skip,
      take,
      hasMore: skip + take < total,
      stats
    });
  } catch (e) {
    console.error("Error fetching reports:", e);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
