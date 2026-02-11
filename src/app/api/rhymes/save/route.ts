import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/rhymes/save - Toggle save for a rhyme (by static rhymeId)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rhymeId } = await request.json();

    if (!rhymeId || typeof rhymeId !== "string") {
      return NextResponse.json({ error: "rhymeId is required" }, { status: 400 });
    }

    const existing = await prisma.savedRhyme.findUnique({
      where: {
        userId_rhymeId: {
          userId: session.user.id,
          rhymeId: rhymeId.trim(),
        },
      },
    });

    if (existing) {
      await prisma.savedRhyme.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedRhyme.create({
      data: {
        userId: session.user.id,
        rhymeId: rhymeId.trim(),
      },
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error saving rhyme:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/rhymes/save - Get user's saved rhyme IDs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ savedIds: [] });
    }

    const saved = await prisma.savedRhyme.findMany({
      where: { userId: session.user.id },
      select: { rhymeId: true },
    });

    return NextResponse.json({ savedIds: saved.map((s) => s.rhymeId) });
  } catch (error) {
    console.error("Error fetching saved rhymes:", error);
    return NextResponse.json({ savedIds: [] });
  }
}
