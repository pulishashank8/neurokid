import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childName = searchParams.get("childName");
    const therapyType = searchParams.get("therapyType");

    const whereClause: any = { userId: session.user.id };
    if (childName) whereClause.childName = childName;
    if (therapyType) whereClause.therapyType = therapyType;

    const sessions = await prisma.therapySession.findMany({
      where: whereClause,
      orderBy: { sessionDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ sessions });
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
        notes: notes || null,
        wentWell: wentWell || null,
        toWorkOn: toWorkOn || null,
        mood: mood || null,
      },
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Error creating therapy session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
