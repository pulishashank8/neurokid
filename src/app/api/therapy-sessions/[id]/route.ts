import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { FieldEncryption } from "@/lib/encryption";

function decryptSession(session: { notes?: string | null; wentWell?: string | null; toWorkOn?: string | null } & Record<string, unknown>) {
  return {
    ...session,
    notes: FieldEncryption.decryptOrPassthrough(session.notes),
    wentWell: FieldEncryption.decryptOrPassthrough(session.wentWell),
    toWorkOn: FieldEncryption.decryptOrPassthrough(session.toWorkOn),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingSession = await prisma.therapySession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const decrypted = decryptSession(existingSession);
    return NextResponse.json({ session: decrypted });
  } catch (error) {
    console.error("Error fetching therapy session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingSession = await prisma.therapySession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.therapySession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting therapy session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingSession = await prisma.therapySession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updatedSession = await prisma.therapySession.update({
      where: { id },
      data: {
        childName: body.childName,
        therapistName: body.therapistName,
        therapyType: body.therapyType,
        sessionDate: new Date(body.sessionDate),
        duration: body.duration || 60,
        notes: FieldEncryption.encrypt(body.notes || null),
        wentWell: FieldEncryption.encrypt(body.wentWell || null),
        toWorkOn: FieldEncryption.encrypt(body.toWorkOn || null),
        mood: body.mood ?? null,
      },
    });

    const decrypted = decryptSession(updatedSession);
    return NextResponse.json({ session: decrypted });
  } catch (error) {
    console.error("Error updating therapy session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
