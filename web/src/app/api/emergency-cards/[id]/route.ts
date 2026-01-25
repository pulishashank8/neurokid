import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

    const existingCard = await prisma.emergencyCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.emergencyCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting emergency card:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
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

    const existingCard = await prisma.emergencyCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const updatedCard = await prisma.emergencyCard.update({
      where: { id },
      data: {
        childName: body.childName,
        childAge: body.childAge ? parseInt(body.childAge) : null,
        diagnosis: body.diagnosis || null,
        triggers: body.triggers || null,
        calmingStrategies: body.calmingStrategies || null,
        communication: body.communication || null,
        medications: body.medications || null,
        allergies: body.allergies || null,
        emergencyContact1Name: body.emergencyContact1Name || null,
        emergencyContact1Phone: body.emergencyContact1Phone || null,
        emergencyContact2Name: body.emergencyContact2Name || null,
        emergencyContact2Phone: body.emergencyContact2Phone || null,
        doctorName: body.doctorName || null,
        doctorPhone: body.doctorPhone || null,
        additionalNotes: body.additionalNotes || null,
      },
    });

    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    console.error("Error updating emergency card:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}
