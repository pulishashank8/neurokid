import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cards = await prisma.emergencyCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error fetching emergency cards:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      childName,
      childAge,
      diagnosis,
      triggers,
      calmingStrategies,
      communication,
      medications,
      allergies,
      emergencyContact1Name,
      emergencyContact1Phone,
      emergencyContact2Name,
      emergencyContact2Phone,
      doctorName,
      doctorPhone,
      additionalNotes,
    } = body;

    if (!childName) {
      return NextResponse.json({ error: "Child name is required" }, { status: 400 });
    }

    const card = await prisma.emergencyCard.create({
      data: {
        userId: session.user.id,
        childName,
        childAge: childAge ? parseInt(childAge) : null,
        diagnosis: diagnosis || null,
        triggers: triggers || null,
        calmingStrategies: calmingStrategies || null,
        communication: communication || null,
        medications: medications || null,
        allergies: allergies || null,
        emergencyContact1Name: emergencyContact1Name || null,
        emergencyContact1Phone: emergencyContact1Phone || null,
        emergencyContact2Name: emergencyContact2Name || null,
        emergencyContact2Phone: emergencyContact2Phone || null,
        doctorName: doctorName || null,
        doctorPhone: doctorPhone || null,
        additionalNotes: additionalNotes || null,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error("Error creating emergency card:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
