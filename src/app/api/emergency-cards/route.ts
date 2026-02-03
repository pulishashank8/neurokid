import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { FieldEncryption } from "@/lib/encryption";
import { z } from "zod";
import { RateLimits, enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-handler";
import { createLogger } from "@/lib/logger";

// Validation schema for emergency card fields
const EmergencyCardSchema = z.object({
  childName: z.string().min(1).max(100),
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
  // Basic XSS prevention - remove script tags and dangerous attributes
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit(
      RateLimits.emergencyCardRead,
      session.user.id
    );
    if (rateLimitResult) return rateLimitResult;

    const cards = await prisma.emergencyCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Decrypt PHI fields before returning
    const decryptedCards = cards.map((card) => ({
      ...card,
      triggers: FieldEncryption.decrypt(card.triggers),
      calmingStrategies: FieldEncryption.decrypt(card.calmingStrategies),
      communication: FieldEncryption.decrypt(card.communication),
      medications: FieldEncryption.decrypt(card.medications),
      allergies: FieldEncryption.decrypt(card.allergies),
      additionalNotes: FieldEncryption.decrypt(card.additionalNotes),
    }));

    logger.info({ userId: session.user.id, count: cards.length }, "Emergency cards accessed");

    return NextResponse.json({ cards: decryptedCards });
  } catch (error) {
    logger.error({ error }, "Error fetching emergency cards");
    return NextResponse.json(
      { error: "Failed to fetch emergency cards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const validation = EmergencyCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate required field
    if (!data.childName?.trim()) {
      return NextResponse.json(
        { error: "Child name is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs and encrypt PHI fields
    const card = await prisma.emergencyCard.create({
      data: {
        userId: session.user.id,
        childName: sanitizeInput(data.childName) || "",
        childAge: data.childAge ? parseInt(String(data.childAge)) : null,
        diagnosis: sanitizeInput(data.diagnosis),
        // Encrypt PHI fields
        triggers: FieldEncryption.encrypt(sanitizeInput(data.triggers)),
        calmingStrategies: FieldEncryption.encrypt(sanitizeInput(data.calmingStrategies)),
        communication: FieldEncryption.encrypt(sanitizeInput(data.communication)),
        medications: FieldEncryption.encrypt(sanitizeInput(data.medications)),
        allergies: FieldEncryption.encrypt(sanitizeInput(data.allergies)),
        emergencyContact1Name: sanitizeInput(data.emergencyContact1Name),
        emergencyContact1Phone: sanitizeInput(data.emergencyContact1Phone),
        emergencyContact2Name: sanitizeInput(data.emergencyContact2Name),
        emergencyContact2Phone: sanitizeInput(data.emergencyContact2Phone),
        doctorName: sanitizeInput(data.doctorName),
        doctorPhone: sanitizeInput(data.doctorPhone),
        additionalNotes: FieldEncryption.encrypt(sanitizeInput(data.additionalNotes)),
      },
    });

    logger.info({ userId: session.user.id, cardId: card.id }, "Emergency card created");

    // Return decrypted card for UI consistency
    return NextResponse.json({
      card: {
        ...card,
        triggers: FieldEncryption.decrypt(card.triggers),
        calmingStrategies: FieldEncryption.decrypt(card.calmingStrategies),
        communication: FieldEncryption.decrypt(card.communication),
        medications: FieldEncryption.decrypt(card.medications),
        allergies: FieldEncryption.decrypt(card.allergies),
        additionalNotes: FieldEncryption.decrypt(card.additionalNotes),
      },
    }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Error creating emergency card");
    return NextResponse.json(
      { error: "Failed to create emergency card" },
      { status: 500 }
    );
  }
}
