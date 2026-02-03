/**
 * AI Chat API v1
 * 
 * Async, non-blocking AI chat with job queue
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { AIJobQueue } from "@/lib/queue/ai-job-queue";
import { withApiHandler } from "@/lib/api-handler";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

/**
 * POST /api/v1/ai/chat
 * Submit chat message and get job ID for polling
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Primary rate limit (per minute)
    const rateLimitResponse = await enforceRateLimit(
      RateLimits.aiChat,
      userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Daily rate limit
    const dailyLimitResponse = await enforceRateLimit(
      RateLimits.aiChatDaily,
      `${userId}:daily`
    );
    if (dailyLimitResponse) return dailyLimitResponse;

    const body = await request.json();
    const validation = chatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { message, conversationId } = validation.data;

    // Basic content moderation
    const moderation = moderateContent(message);
    if (!moderation.approved) {
      return NextResponse.json(
        { error: "Content flagged", reason: moderation.reason },
        { status: 400 }
      );
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: {
          userId,
          title: message.substring(0, 50),
        },
      });
      convId = conv.id;
    } else {
      // Verify conversation ownership
      const conv = await prisma.aIConversation.findFirst({
        where: { id: convId, userId },
      });
      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        userId,
        role: "user",
        content: message,
      },
    });

    // Get conversation history
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20, // Last 20 messages for context
    });

    // Build messages array with system prompt
    const messages = [
      {
        role: "system" as const,
        content: `You are NeuroAI, a compassionate AI assistant for NeuroKid - supporting autistic children and their families.

Your purpose:
- Provide supportive, understanding responses about autism and neurodiversity
- Help parents understand their child's needs and behaviors
- Offer evidence-based strategies for daily challenges
- Connect families with appropriate resources
- Never provide medical diagnoses or replace professional healthcare advice

Guidelines:
- Use clear, simple language
- Be patient and non-judgmental
- Acknowledge emotions and validate experiences
- Focus on strengths-based approaches
- Keep responses concise but helpful`,
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Submit to async queue
    const jobId = await AIJobQueue.submit(userId, convId, messages);

    // Return 202 Accepted with polling URL
    return NextResponse.json(
      {
        jobId,
        status: "pending",
        pollUrl: `/api/v1/ai/jobs/${jobId}`,
        conversationId: convId,
      },
      { status: 202 }
    );
  },
  {
    routeName: "POST /api/v1/ai/chat",
  }
);

/**
 * Basic content moderation
 * TODO: Replace with ML-based moderation service
 */
function moderateContent(message: string): { approved: boolean; reason?: string } {
  const lower = message.toLowerCase();
  
  // List of prohibited patterns (basic implementation)
  const prohibited = [
    /\b(kill|murder)\s+(myself|himself|herself|yourself)\b/,
    /\bsuicide\s+methods?\b/,
    /\bhow\s+to\s+make\s+(a\s+)?bomb\b/,
    /\b(child|kids?)\s+(porn|sex|abuse)\b/,
  ];

  for (const pattern of prohibited) {
    if (pattern.test(lower)) {
      return {
        approved: false,
        reason: "Content violates safety guidelines",
      };
    }
  }

  return { approved: true };
}
