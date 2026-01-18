import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, reason } = body as { action?: string; reason?: string };

    const allowedActions = ["DISMISS", "REVIEW", "RESOLVE"] as const;
    if (!action || !allowedActions.includes(action as any)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let updatedReport = report;

    // Perform action
    if (action === "DISMISS") {
      updatedReport = await prisma.report.update({ where: { id }, data: { status: "DISMISSED" } });
    } else if (action === "REVIEW") {
      updatedReport = await prisma.report.update({ where: { id }, data: { status: "UNDER_REVIEW" } });
    } else if (action === "RESOLVE") {
      updatedReport = await prisma.report.update({ where: { id }, data: { status: "RESOLVED" } });
    }

    const actionTypeMap = {
      DISMISS: "UNPIN",
      REVIEW: "WARN",
      RESOLVE: "REMOVE",
    } as const;

    // Log the action
    await prisma.modActionLog.create({
      data: {
        actionType: actionTypeMap[action as keyof typeof actionTypeMap],
        targetType: report.targetType,
        targetId: report.targetId,
        moderatorId: session.user.id,
        reason: reason || report.reason,
        notes: reason || undefined,
      },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (e) {
    console.error("Error updating report:", e);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
