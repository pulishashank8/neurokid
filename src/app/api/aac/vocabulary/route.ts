// AAC Vocabulary API - GET all and POST new custom words
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating a new word
const createWordSchema = z.object({
  label: z.string().min(1).max(100),
  symbol: z.string().min(1).max(255),
  category: z.enum(["CORE", "FOOD", "SENSORY", "EMERGENCY", "SOCIAL", "ACTIONS", "CUSTOM"]),
  audioText: z.string().max(255).optional(),
  order: z.number().int().min(0).optional(),
});

// GET /api/aac/vocabulary - Get all custom words for the current user
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all custom vocabulary for this user
    const vocabulary = await prisma.aACVocabulary.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(vocabulary);
  } catch (error) {
    console.error("Error fetching AAC vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}

// POST /api/aac/vocabulary - Create a new custom word
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createWordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { label, symbol, category, audioText, order } = validationResult.data;

    // Get the highest order number for this user's vocabulary
    const maxOrderWord = await prisma.aACVocabulary.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = order ?? (maxOrderWord?.order ?? 0) + 1;

    // Create the new word
    const newWord = await prisma.aACVocabulary.create({
      data: {
        userId: user.id,
        label,
        symbol,
        category,
        audioText: audioText || null,
        order: newOrder,
        isActive: true,
      },
    });

    return NextResponse.json(newWord, { status: 201 });
  } catch (error) {
    console.error("Error creating AAC vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to create vocabulary word" },
      { status: 500 }
    );
  }
}
