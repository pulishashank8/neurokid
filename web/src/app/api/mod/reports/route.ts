import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = Math.min(parseInt(searchParams.get("take") || "20"), 100);
    const status = searchParams.get("status");
    const targetType = searchParams.get("targetType");

    const where: any = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

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

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        targetType: r.targetType,
        targetId: r.targetId,
        status: r.status,
        createdAt: r.createdAt,
        reporter: r.reporter ? { id: r.reporter.id, username: (r.reporter.profile as any)?.username ?? null } : null,
      })),
      total,
      skip,
      take,
      hasMore: skip + take < total,
    });
  } catch (e) {
    console.error("Error fetching reports:", e);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
