import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { FieldEncryption } from "@/lib/encryption";
import { z } from "zod";
import { RateLimits, enforceRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

// Validation schema for emergency card update
const EmergencyCardUpdateSchema = z.object({
  childName: z.string().min(1).max(100).optional(),
  childAge: z.union([z.string(), z.number()]).optional().nullable(),
  diagnosis: z.string().max(255).optional().nullable(),
  triggers: z.string().max(5000).optional().nullable(),
  calmingStrategies: z.string().max(5000).optional().nullable(),
  communication: z.string().max(5000).optional().nullable(),
  medications: z.string().max(5000).optional().nullable(),
  allergies: z.string().max(5000).optional().nullable(),
  emergencyContact1Name: z.string().max(100).optional().nullable(),
  emergencyContact1Phone: z.string().max(20).optional().nullable(),
  emergencyContact2Name: z.string().max(100).optional().nullable(),
  emergencyContact2Phone: z.string().max(20).optional().nullable(),
  doctorName: z.string().max(100).optional().nullable(),
  doctorPhone: z.string().max(20).optional().nullable(),
  additionalNotes: z.string().max(10000).optional().nullable(),
});

// Sanitize input to prevent XSS
function sanitizeInput(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const card = await prisma.emergencyCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Decrypt PHI fields
    const decryptedCard = {
      ...card,
      triggers: FieldEncryption.decrypt(card.triggers),
      calmingStrategies: FieldEncryption.decrypt(card.calmingStrategies),
      communication: FieldEncryption.decrypt(card.communication),
      medications: FieldEncryption.decrypt(card.medications),
      allergies: FieldEncryption.decrypt(card.allergies),
      additionalNotes: FieldEncryption.decrypt(card.additionalNotes),
    };

    return NextResponse.json({ card: decryptedCard });
  } catch (error) {
    logger.error({ error }, "Error fetching emergency card");
    return NextResponse.json(
      { error: "Failed to fetch emergency card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit(
      RateLimits.emergencyCardCreate,
      session.user.id
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const existingCard = await prisma.emergencyCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.emergencyCard.delete({
      where: { id },
    });

    logger.info({ userId: session.user.id, cardId: id }, "Emergency card deleted");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Error deleting emergency card");
    return NextResponse.json(
      { error: "Failed to delete emergency card" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit(
      RateLimits.emergencyCardCreate,
      session.user.id
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const validation = EmergencyCardUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingCard = await prisma.emergencyCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Build update data with encryption for PHI fields
    const updateData: any = {};

    if (data.childName !== undefined) {
      updateData.childName = sanitizeInput(data.childName) || "";
    }
    if (data.childAge !== undefined) {
      updateData.childAge = data.childAge ? parseInt(String(data.childAge)) : null;
    }
    if (data.diagnosis !== undefined) {
      updateData.diagnosis = sanitizeInput(data.diagnosis);
    }
    if (data.triggers !== undefined) {
      updateData.triggers = FieldEncryption.encrypt(sanitizeInput(data.triggers));
    }
    if (data.calmingStrategies !== undefined) {
      updateData.calmingStrategies = FieldEncryption.encrypt(sanitizeInput(data.calmingStrategies));
    }
    if (data.communication !== undefined) {
      updateData.communication = FieldEncryption.encrypt(sanitizeInput(data.communication));
    }
    if (data.medications !== undefined) {
      updateData.medications = FieldEncryption.encrypt(sanitizeInput(data.medications));
    }
    if (data.allergies !== undefined) {
      updateData.allergies = FieldEncryption.encrypt(sanitizeInput(data.allergies));
    }
    if (data.emergencyContact1Name !== undefined) {
      updateData.emergencyContact1Name = sanitizeInput(data.emergencyContact1Name);
    }
    if (data.emergencyContact1Phone !== undefined) {
      updateData.emergencyContact1Phone = sanitizeInput(data.emergencyContact1Phone);
    }
    if (data.emergencyContact2Name !== undefined) {
      updateData.emergencyContact2Name = sanitizeInput(data.emergencyContact2Name);
    }
    if (data.emergencyContact2Phone !== undefined) {
      updateData.emergencyContact2Phone = sanitizeInput(data.emergencyContact2Phone);
    }
    if (data.doctorName !== undefined) {
      updateData.doctorName = sanitizeInput(data.doctorName);
    }
    if (data.doctorPhone !== undefined) {
      updateData.doctorPhone = sanitizeInput(data.doctorPhone);
    }
    if (data.additionalNotes !== undefined) {
      updateData.additionalNotes = FieldEncryption.encrypt(sanitizeInput(data.additionalNotes));
    }

    const updatedCard = await prisma.emergencyCard.update({
      where: { id },
      data: updateData,
    });

    logger.info({ userId: session.user.id, cardId: id }, "Emergency card updated");

    // Return decrypted card for UI consistency
    return NextResponse.json({
      card: {
        ...updatedCard,
        triggers: FieldEncryption.decrypt(updatedCard.triggers),
        calmingStrategies: FieldEncryption.decrypt(updatedCard.calmingStrategies),
        communication: FieldEncryption.decrypt(updatedCard.communication),
        medications: FieldEncryption.decrypt(updatedCard.medications),
        allergies: FieldEncryption.decrypt(updatedCard.allergies),
        additionalNotes: FieldEncryption.decrypt(updatedCard.additionalNotes),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error updating emergency card");
    return NextResponse.json(
      { error: "Failed to update emergency card" },
      { status: 500 }
    );
  }
}
