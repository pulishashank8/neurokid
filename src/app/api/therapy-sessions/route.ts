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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childName = searchParams.get("childName");
    const therapyType = searchParams.get("therapyType");

    const whereClause: { userId: string; childName?: string; therapyType?: string } = { userId: session.user.id };
    if (childName) whereClause.childName = childName;
    if (therapyType) whereClause.therapyType = therapyType;

    const sessions = await prisma.therapySession.findMany({
      where: whereClause,
      orderBy: { sessionDate: "desc" },
      take: 50,
    });

    const decryptedSessions = sessions.map(decryptSession);
    return NextResponse.json({ sessions: decryptedSessions });
  } catch (error) {
    console.error("Error fetching therapy sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { childName, therapistName, therapyType, sessionDate, duration, notes, wentWell, toWorkOn, mood } = body;

    if (!childName || !therapistName || !therapyType || !sessionDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSession = await prisma.therapySession.create({
      data: {
        userId: session.user.id,
        childName,
        therapistName,
        therapyType,
        sessionDate: new Date(sessionDate),
        duration: duration || 60,
        notes: FieldEncryption.encrypt(notes || null),
        wentWell: FieldEncryption.encrypt(wentWell || null),
        toWorkOn: FieldEncryption.encrypt(toWorkOn || null),
        mood: mood ?? null,
      },
    });

    const decrypted = decryptSession(newSession);
    return NextResponse.json({ session: decrypted }, { status: 201 });
  } catch (error) {
    console.error("Error creating therapy session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
