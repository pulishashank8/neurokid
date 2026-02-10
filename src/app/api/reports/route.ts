import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
import {
  RATE_LIMITERS,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  checkDuplicateReport,
  blockDuplicateReport,
} from "@/lib/redis";
import { Prisma, ReportStatus, ReportReason } from "@prisma/client";

// GET /api/reports - List reports with optional status filter + pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get("status");
    const skip = Number.parseInt(request.nextUrl.searchParams.get("skip") || "0", 10);
    const take = Math.min(Number.parseInt(request.nextUrl.searchParams.get("take") || "20", 10), 100);

    const where: Prisma.ReportWhereInput = {};
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, profile: { select: { username: true } } } },
        },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    const formatted = reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      targetType: r.targetType,
      targetId: r.targetId,
      status: r.status,
      createdAt: r.createdAt,
      reporter: r.reporter
        ? {
          id: r.reporter.id,
          username: r.reporter.profile?.username ?? null,
        }
        : null,
    }));

    return NextResponse.json({
      reports: formatted,
      pagination: {
        skip,
        take,
        total,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 reports per minute per user
    const canReport = await RATE_LIMITERS.report.checkLimit(session.user.id);
    if (!canReport) {
      const retryAfter = await RATE_LIMITERS.report.getRetryAfter(session.user.id);
      return rateLimitResponse(retryAfter);
    }

    const body = await request.json();
    const validation = createReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    let { targetType, targetId, reason, description } = validation.data;

    // Map reasons to DB enums if needed
    let reportReason: ReportReason = reason as ReportReason;
    if (reason === "MISINFORMATION") reportReason = ReportReason.MISINFO;
    if (reason === "INAPPROPRIATE") reportReason = ReportReason.INAPPROPRIATE_CONTENT;

    // Verify target exists
    if (targetType === "POST") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    } else if (targetType === "COMMENT") {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }
    } else if (targetType === "USER") {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Redis-backed duplicate prevention (24h)
    const redisDuplicate = await checkDuplicateReport(
      session.user.id,
      targetType,
      targetId
    );
    if (redisDuplicate) {
      return NextResponse.json(
        { error: "You have already reported this content recently" },
        { status: 400 }
      );
    }

    // DB-backed duplicate prevention
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        targetType,
        targetId,
        createdAt: { gte: twentyFourHoursAgo },
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          error: "You have already reported this content in the last 24 hours",
        },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason: reportReason,
        description: description || null,
        status: "OPEN",
      },
      select: {
        id: true,
        reason: true,
        targetType: true,
        targetId: true,
        status: true,
        createdAt: true,
      },
    });

    await blockDuplicateReport(session.user.id, targetType, targetId);

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted successfully.",
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
