// AAC Vocabulary API - GET, PUT, DELETE individual words
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating a word
const updateWordSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(255).optional(),
  category: z.enum(["CORE", "FOOD", "SENSORY", "EMERGENCY", "SOCIAL", "ACTIONS", "CUSTOM"]).optional(),
  audioText: z.string().max(255).nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/aac/vocabulary/[id] - Get a specific word
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const word = await prisma.aACVocabulary.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json(word);
  } catch (error) {
    console.error("Error fetching AAC word:", error);
    return NextResponse.json(
      { error: "Failed to fetch word" },
      { status: 500 }
    );
  }
}

// PUT /api/aac/vocabulary/[id] - Update a word
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if word exists and belongs to user
    const existingWord = await prisma.aACVocabulary.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateWordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update the word
    const updatedWord = await prisma.aACVocabulary.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error("Error updating AAC word:", error);
    return NextResponse.json(
      { error: "Failed to update word" },
      { status: 500 }
    );
  }
}

// DELETE /api/aac/vocabulary/[id] - Delete a word (soft delete by setting isActive to false)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if word exists and belongs to user
    const existingWord = await prisma.aACVocabulary.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await prisma.aACVocabulary.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Word deleted" });
  } catch (error) {
    console.error("Error deleting AAC word:", error);
    return NextResponse.json(
      { error: "Failed to delete word" },
      { status: 500 }
    );
  }
}
