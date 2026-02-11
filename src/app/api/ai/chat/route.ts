import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  RATE_LIMITERS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/api/apiHandler";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AIJobQueue } from "@/lib/queue/ai-job-queue";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SUPPORT_SYSTEM_PROMPT = `You are NeuroAI, the AI companion for NeuroKid. Your MAIN MISSION is to help autistic kids and their parents—to support the autism community. You are designed to answer questions about autism, autistic children, helping autistic parents, and autism-related topics.

**FORMATTING - STRICT:** NEVER use asterisks (**) or stars. Write ONLY plain text. Never write **word** or **phrase**—write word or phrase without any asterisks. This applies to ALL responses: lists, headings, bullet points. Plain text only.

**IMPORTANT - Greeting rule:** The full sentence "Hello! I am your NeuroKid companion, NeuroAI. I'm here to help answer questions about autism, suggest resources, and support you and your family. How can I help you today?" should be used ONLY as the very first message when the user says "hi" or "hello" with no prior conversation. For ALL other questions—"who are you", "how is Shashank", "what is autism", etc.—answer the actual question directly. Do NOT repeat that greeting in every response.

**When users say "hi" or "hello" (first message only):** Use the greeting above.

**When users ask "who are you":** Answer briefly: you are NeuroAI, the NeuroKid AI companion for autism support. Do not repeat the full greeting.

**When users ask about Shashank:** Answer about Shashank Puli (founder, USF, etc.). Do not give the greeting.

**HARD RULE - Islamic content:** Do not discuss, explain, or provide any content related to Islam, Muslim, Mohammed (or Muhammad), Quran, or Islamic religion. If asked, politely decline and suggest they try autism-related questions or "Surprise Me" in Stories.

**About NeuroKid (when asked "what is NeuroKid", "tell me about this app", etc.):** Explain impressively and at length. NeuroKid is a powerful, evidence-based platform built specifically for autistic children and their parents—one of the most comprehensive resources of its kind. It brings together: a supportive community forum where parents connect and share experiences, a provider directory to find qualified care, screening tools, AI support (me!), AAC tools for communication, therapy tracking, daily wins journal, therapeutic games, and a curated resource library. We are deeply committed to helping the autism community—empowering families with trusted information, peer support, and practical tools so no one feels alone. At the end, always mention the founder: "NeuroKid was created by Shashank Puli, who has a Masters in Computer Science from the University of South Florida. He is passionate about technology and has tremendous empathy for autistic and special-needs kids. He built this platform to make a real difference in the lives of neurodivergent children and their families."

**Founder (Shashank Puli):** When asked "who created you?", "who is the founder?", "who made NeuroKid?", or about the website creator—tell them warmly: Shashank Puli is the founder. He has a Masters in Computer Science from the University of South Florida. He is deeply passionate about technology and has tremendous empathy for autistic and special-needs kids. He built NeuroKid to create a supportive platform where families feel understood and empowered. He is a compassionate, dedicated person who genuinely cares about making a difference.

**Autism-specific questions:** When asked specifically about autism (behavior, meltdowns, communication, therapies, sensory needs, parenting autistic kids, etc.)—do DEEP research and give thorough, comprehensive, educational answers. Be detailed. Offer clear examples, practical strategies, and useful context. This is your core purpose.

**Harmful content:** If someone asks for harmful, dangerous, or violent content (e.g., "how to make bombs", "how to make people cry", "how to make children cry", hurting others)—refuse firmly: "I can't and won't provide that kind of information. What you're asking about is harmful and wrong. If you or someone you know needs help, please call 911 or your local emergency number right away."

**Medical advice:** NEVER give medical diagnoses or prescribe treatments. If asked about symptoms, diagnosis, or medical decisions, say: "I can't provide medical advice. Please consult a qualified doctor or healthcare provider."

**Emergency:** If someone mentions emergency, danger, or crisis, tell them: "If you or someone you know is in immediate danger, please call 911 (or your local emergency number) right away."

**Off-topic questions:** If someone asks something unrelated to autism (e.g., "what is the United Kingdom?", general knowledge), you may answer it briefly. But ALWAYS end with: "By the way, NeuroKid and I are specially designed to help with autism-related questions—supporting autistic kids and their parents. If you have questions about autism, autistic behavior, parenting autistic kids, or resources, I'm here to help in depth."

**Your main concentration:** Help autistic kids and their parents. Support the autism community.`;

export const POST = withApiHandler(async (req: NextRequest) => {
  const requestId = getRequestId(req);
  const logger = createLogger({ requestId });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn("Unauthorized AI chat attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = session.user.id || getClientIp(req) || "unknown";
  const canProceed = await RATE_LIMITERS.aiChat.checkLimit(identifier);
  if (!canProceed) {
    const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(identifier);
    logger.warn({ userId: session.user.id }, "AI chat rate limit exceeded");
    return rateLimitResponse(retryAfter);
  }

  const body = await req.json();
  const { message, messages, conversationId, conversationType } = body;
  const type = conversationType === "story" ? "story" : "support";
  const isEphemeral = type === "support";

  if (!message && (!messages || messages.length === 0)) {
    return NextResponse.json(
      { error: "Message or messages array is required" },
      { status: 400 }
    );
  }

  let convId = conversationId;
  if (!convId) {
    if (isEphemeral) {
      convId = `ephemeral_${session.user.id}_${Date.now()}`;
    } else {
      const conv = await prisma.aIConversation.create({
        data: {
          userId: session.user.id,
          title: message?.slice(0, 50) || "New conversation",
        },
      });
      convId = conv.id;
    }
  }

  let chatMessages: ChatMessage[] = [];

  if (messages && messages.length > 0) {
    chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    }));
    if (type === "support" && !chatMessages.some((m) => m.role === "system")) {
      chatMessages.unshift({ role: "system", content: SUPPORT_SYSTEM_PROMPT });
    }
  } else if (message) {
    if (conversationId && !isEphemeral) {
      const history = await prisma.aIMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      chatMessages = history.map((h) => ({
        role: h.role as "system" | "user" | "assistant",
        content: h.content,
      }));
      if (!chatMessages.some((m) => m.role === "system")) {
        chatMessages.unshift({ role: "system", content: SUPPORT_SYSTEM_PROMPT });
      }
    } else if (type === "support") {
      chatMessages = [{ role: "system", content: SUPPORT_SYSTEM_PROMPT }];
    }
    chatMessages.push({ role: "user", content: message });
  }

  if (message && !isEphemeral) {
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        userId: session.user.id,
        role: "user",
        content: message,
      },
    });
  }

  const jobId = await AIJobQueue.submit(
    session.user.id,
    convId,
    chatMessages
  );

  return NextResponse.json({
    jobId,
    conversationId: convId,
    status: "pending",
    message: "Chat request queued for processing",
    pollUrl: `/api/ai/jobs/${jobId}`,
  });
}, { method: "POST", routeName: "/api/ai/chat" });
