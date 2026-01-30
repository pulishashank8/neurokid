import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  RATE_LIMITERS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

interface ChatMessage {
  role: string;
  content: string;
}

export const POST = withApiHandler(async (req: NextRequest) => {
  const requestId = getRequestId(req);
  const logger = createLogger({ requestId });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn('Unauthorized AI chat attempt');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = session.user.id || getClientIp(req) || "unknown";
  const canProceed = await RATE_LIMITERS.aiChat.checkLimit(identifier);
  if (!canProceed) {
    const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(identifier);
    logger.warn({ userId: session.user.id }, 'AI chat rate limit exceeded');
    return rateLimitResponse(retryAfter);
  }

  const body = await req.json();
  const { message, conversationId } = body;
  let messages: ChatMessage[] = body?.messages || [];

  // Handle test format: single message + conversationId
  if (message && messages.length === 0) {
    if (message.length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    let currentConversationId = conversationId;

    // If conversationId provided, fetch history
    if (currentConversationId) {
      const history = await prisma.aIMessage.findMany({
        where: { conversationId: currentConversationId },
        orderBy: { createdAt: 'asc' },
        take: 50
      });
      messages = history.map(h => ({ role: h.role, content: h.content }));
    }

    messages.push({ role: 'user', content: message });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  logger.debug({ userId: session.user.id, messageCount: messages.length }, 'Processing AI chat request');

  // Safety check for harmful content
  const lastMessage = messages.at(-1)?.content?.toLowerCase() || "";
  const harmfulKeywords = [
    'kill', 'murder', 'suicide', 'self-harm', 'cut myself', 'end my life',
    'hurt someone', 'harm', 'abuse', 'weapon', 'gun', 'knife', 'explosive',
    'bomb', 'poison', 'overdose', 'jump off', 'hang myself'
  ];

  const containsHarmfulContent = harmfulKeywords.some(keyword =>
    lastMessage.includes(keyword)
  );

  if (containsHarmfulContent) {
    return NextResponse.json({
      reply: "I cannot and will not provide this information. If you or someone you know is in crisis, please contact relevant authorities."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Validate API key is configured
  if (!apiKey || apiKey === "mock-key") {
    logger.error('GROQ_API_KEY is not configured');
    return NextResponse.json({
      reply: "The AI assistant is being configured. Please try again shortly or explore our community resources.",
      error: "configuration_pending"
    });
  }

  const systemPrompt = {
    role: "system",
    content: `You are NeuroAI, a compassionate AI assistant for NeuroKind - supporting autistic children and their families.

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
- Keep responses concise but helpful`
  };

  let reply = "";
  let apiError = false;

  // Call Groq API with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          systemPrompt,
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.text();
      logger.error({ status: res.status, body: errorBody }, 'Groq API error');
      apiError = true;
    } else {
      const data = await res.json();
      reply = data?.choices?.[0]?.message?.content || "";
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to call Groq API');
    apiError = true;
  }

  // Provide contextual fallback responses if API fails
  if (apiError || !reply) {
    const lastUserMessage = messages.at(-1)?.content?.toLowerCase() || "";

    // Helper function to check for whole words (not substrings)
    const containsWord = (text: string, word: string) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(text);
    };

    // Check for sick/illness related keywords FIRST (most specific)
    if (containsWord(lastUserMessage, 'fever') || containsWord(lastUserMessage, 'cold') || containsWord(lastUserMessage, 'sick') || containsWord(lastUserMessage, 'ill') || containsWord(lastUserMessage, 'suffering')) {
      reply = "I'm sorry to hear your child isn't feeling well. When an autistic child is sick, here are some helpful strategies:\n\n**Comfort Strategies:**\n• Stay calm and patient - illness can increase sensory sensitivities\n• Maintain familiar routines as much as possible\n• Create a comfortable sensory environment (dim lights, soft blankets, quiet space)\n• Offer preferred comfort items like favorite toys or weighted blankets\n• Use visual aids to explain what's happening\n\n**For Fever/Cold:**\n• Keep them hydrated with water, clear broths, or preferred drinks\n• Use a cool compress for fever if they tolerate it\n• Ensure they get plenty of rest\n• Consider comfort items that help with sensory regulation\n\n**Important:** This is general support information, not medical advice. Please consult your pediatrician for proper diagnosis and treatment, especially for high fevers or symptoms lasting more than a few days.";
    } else if (containsWord(lastUserMessage, 'calm') || containsWord(lastUserMessage, 'relax') || containsWord(lastUserMessage, 'anxious') || containsWord(lastUserMessage, 'anxiety')) {
      reply = "Helping an autistic child calm down requires patience and understanding. Here are effective strategies:\n\n• **Deep pressure** - Weighted blankets, firm hugs (if welcomed), compression clothing\n• **Sensory breaks** - A quiet, dim space away from stimulation\n• **Breathing exercises** - Blow bubbles, pinwheels, or slow deep breaths together\n• **Familiar comforts** - Favorite toys, music, or calming videos\n• **Reduce demands** - This isn't the time for tasks or transitions\n• **Stay calm yourself** - Children often mirror our energy\n• **Sensory tools** - Fidgets, soft textures, or calming music";
    } else if (containsWord(lastUserMessage, 'meltdown') || containsWord(lastUserMessage, 'overwhelm')) {
      reply = "Meltdowns can be challenging for both the child and caregivers. They're often a response to sensory or emotional overload.\n\n**Key strategies:**\n• Stay calm - your presence helps\n• Ensure safety - remove dangerous objects, guide to safe space\n• Reduce sensory input - dim lights, lower sounds\n• Don't try to reason during the meltdown - wait until calmer\n• Offer comfort items if wanted\n• Give time and space to recover\n• Avoid punishment - meltdowns aren't behavior problems";
    } else if (containsWord(lastUserMessage, 'sleep') || containsWord(lastUserMessage, 'bedtime')) {
      reply = "Sleep challenges are common in autistic children. Strategies that help:\n\n• Consistent bedtime routines\n• Calm sensory environment (dark, quiet, cool)\n• Visual schedules for bedtime steps\n• Weighted blankets (if comfortable)\n• White noise or calming music\n• Limiting screens before bed\n\nConsult your healthcare provider for persistent sleep issues.";
    } else if (containsWord(lastUserMessage, 'food') || containsWord(lastUserMessage, 'eat') || containsWord(lastUserMessage, 'picky')) {
      reply = "Many autistic children have specific food preferences or sensory sensitivities around eating:\n\n• **Respect sensory preferences** - Texture, smell, and appearance matter\n• **Offer familiar foods** alongside new ones without pressure\n• **Keep mealtimes calm** and low-pressure\n• **Try food chaining** - Introduce similar foods gradually\n• **Consider sensory aspects** - Temperature, utensils, plate colors\n\nConsult a feeding therapist if concerns persist.";
    } else if (containsWord(lastUserMessage, 'communicate') || containsWord(lastUserMessage, 'talk') || containsWord(lastUserMessage, 'speak')) {
      reply = "Communication looks different for every autistic child. Supportive approaches include:\n\n• **AAC tools** - Picture cards, apps, or communication devices\n• **Honor all communication** - Gestures, sounds, and behaviors count\n• **Use visual supports** - Pictures, schedules, social stories\n• **Give processing time** - Wait 10+ seconds for responses\n• **Reduce verbal demands** during stressful times\n\nConsider working with a speech-language pathologist who understands autism.";
    } else if (containsWord(lastUserMessage, 'school') || containsWord(lastUserMessage, 'education')) {
      reply = "Education support for autistic children often involves working with the school to create accommodations. Consider requesting an IEP (Individualized Education Program) meeting. Our resources section has guides on advocating for your child's educational needs.";
    } else if (containsWord(lastUserMessage, 'autism') || containsWord(lastUserMessage, 'autistic')) {
      reply = "Autism is a neurodevelopmental difference that affects how people perceive and interact with the world. Every autistic person is unique with their own strengths and challenges. Our resource library has excellent information about understanding and supporting autistic children.";
    } else if (containsWord(lastUserMessage, 'help') || containsWord(lastUserMessage, 'support')) {
      reply = "I understand you're looking for support. Our community forum is a great place where parents share experiences and advice. You can also check our resources section for helpful guides. Is there something specific I can help with?";
    } else if (containsWord(lastUserMessage, 'hello') || containsWord(lastUserMessage, 'hi') || containsWord(lastUserMessage, 'hey')) {
      // Greeting check at the END to avoid matching words like "him", "this", etc.
      reply = "Hello! I'm NeuroAI, here to support you and your family. How can I help you today?";
    } else {
      reply = "I'm here to help! I can assist with questions about:\n\n• Autism and neurodiversity\n• Calming strategies and anxiety\n• Sleep and bedtime routines\n• School and education support\n• Sensory needs and meltdowns\n• Communication strategies\n• Supporting a sick child\n\nPlease ask your question, and I'll do my best to help. For medical concerns, always consult your healthcare provider.";
    }
  }

  // PERSISTENCE
  let finalConversationId = conversationId;

  if (!finalConversationId) {
    const conv = await prisma.aIConversation.create({
      data: {
        userId: session.user.id,
        title: message?.substring(0, 50) || "Chat Session"
      }
    });
    finalConversationId = conv.id;
  }

  // Save User message
  const userMsg = messages.at(-1);
  await prisma.aIMessage.create({
    data: {
      conversationId: finalConversationId,
      userId: session.user.id,
      role: 'user',
      content: userMsg?.content || message || ""
    }
  });

  // Save Assistant message
  await prisma.aIMessage.create({
    data: {
      conversationId: finalConversationId,
      userId: session.user.id,
      role: 'assistant',
      content: reply
    }
  });

  return NextResponse.json({
    reply,
    conversationId: finalConversationId
  });
}, { method: 'POST', routeName: '/api/ai/chat' });
