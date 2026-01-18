import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  RATE_LIMITERS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identifier = session.user.id || getClientIp(req) || "unknown";
    const canProceed = await RATE_LIMITERS.aiChat.checkLimit(identifier);
    if (!canProceed) {
      const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(identifier);
      return rateLimitResponse(retryAfter);
    }

    const body = await req.json();
    const messages: ChatMessage[] = body?.messages || [];
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    // Minimal REST call to OpenAI (GPT-4o-mini or similar) without adding new deps
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
      }),
    });
    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content || "I'm here to help with general guidance.";
    return NextResponse.json({ reply });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process";
    console.error("AI chat error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
