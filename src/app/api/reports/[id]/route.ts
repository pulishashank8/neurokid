import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/rbac";
import { Report, Post, Comment, User, Profile } from "@prisma/client";

// Union type for report target (simplified for API response)
type ReportTarget = Record<string, unknown> | null;

interface ReportWithReporter extends Report {
  reporter: {
    id: string;
    profile: Profile | null;
  } | null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, profile: { select: { username: true } } },
        },
      },
    });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let target: ReportTarget = null;
    if (report.targetType === "POST") {
      target = await prisma.post.findUnique({
        where: { id: report.targetId },
        include: {
          author: { select: { id: true, profile: { select: { username: true, avatarUrl: true } } } },
          category: true,
          tags: true,
        },
      });
    } else if (report.targetType === "COMMENT") {
      target = await prisma.comment.findUnique({
        where: { id: report.targetId },
        include: { author: { select: { id: true, profile: { select: { username: true, avatarUrl: true } } } }, post: true },
      });
    } else if (report.targetType === "USER") {
      target = await prisma.user.findUnique({ where: { id: report.targetId }, select: { id: true, profile: true } });
    }

    const formatted = {
      id: report.id,
      reason: report.reason,
      description: report.description,
      targetType: report.targetType,
      targetId: report.targetId,
      status: report.status,
      createdAt: report.createdAt,
      reporter: report.reporter ? { id: report.reporter.id, username: report.reporter.profile?.username ?? null } : null,
      target,
    };

    return NextResponse.json({ report: formatted });
  } catch (e) {
    console.error("Error fetching report:", e);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const action: string = body.action;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let updatedReport: Report = report;

    switch (action) {
      case "DISMISS":
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "DISMISSED" } });
        break;
      case "RESOLVE":
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "RESOLVED" } });
        break;
      case "REMOVE_POST":
        await prisma.post.update({ where: { id: report.targetId }, data: { status: "REMOVED" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "RESOLVED" } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, postId: report.targetId, action: "REMOVE" } });
        break;
      case "LOCK_POST":
        await prisma.post.update({ where: { id: report.targetId }, data: { isLocked: true } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, postId: report.targetId, action: "LOCK" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "UNDER_REVIEW" } });
        break;
      case "UNLOCK_POST":
        await prisma.post.update({ where: { id: report.targetId }, data: { isLocked: false } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, postId: report.targetId, action: "UNPIN" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "UNDER_REVIEW" } });
        break;
      case "PIN_POST":
        await prisma.post.update({ where: { id: report.targetId }, data: { isPinned: true, pinnedAt: new Date() } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, postId: report.targetId, action: "PIN" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "UNDER_REVIEW" } });
        break;
      case "UNPIN_POST":
        await prisma.post.update({ where: { id: report.targetId }, data: { isPinned: false, pinnedAt: null } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, postId: report.targetId, action: "UNPIN" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "UNDER_REVIEW" } });
        break;
      case "REMOVE_COMMENT":
        await prisma.comment.update({ where: { id: report.targetId }, data: { status: "REMOVED" } });
        await prisma.moderationAction.create({ data: { actorId: session.user.id, commentId: report.targetId, action: "REMOVE" } });
        updatedReport = await prisma.report.update({ where: { id: report.id }, data: { status: "RESOLVED" } });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ report: updatedReport });
  } catch (e) {
    console.error("Error updating report:", e);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
