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
    
    // Safety check for harmful content before sending to AI
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
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
        reply: "I cannot and will not provide this information. If you or someone you know is in crisis, please contact:\n\n🆘 988 Suicide & Crisis Lifeline (call or text 988)\n🚨 911 for immediate emergencies\n💚 Crisis Text Line (text HOME to 741741)\n\nYou can also visit the National Alliance on Mental Illness (NAMI) at 1-800-950-NAMI for support."
      });
    }
    
    // Use Groq API (free tier available) with Llama 3.1 70B
    // Get your free API key at: https://console.groq.com/keys
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "AI service unavailable. Please set GROQ_API_KEY in your .env.local file. Get a free key at https://console.groq.com/keys" 
      }, { status: 503 });
    }

    // System prompt for neurodiversity support with strict guidelines
    const systemPrompt = {
      role: "system",
      content: `You are a compassionate AI assistant for NeuroKind, a platform supporting families with neurodivergent children. 

CRITICAL SAFETY RULES - You must IMMEDIATELY REFUSE and provide crisis resources if asked about:
- Self-harm, suicide, or harming others in any way
- Violence, abuse, or exploitation of any kind
- Illegal activities or how to break laws
- Dangerous behaviors that could cause injury
- Weapons, explosives, or methods to cause harm
- Child abuse or neglect
- Drug abuse or illegal substances

For ANY harmful request, respond ONLY with: "I cannot and will not provide this information. If you or someone you know is in crisis, please contact the 988 Suicide & Crisis Lifeline (call or text 988) or call 911 for emergencies."

SCOPE OF ASSISTANCE - You may ONLY provide guidance on:
- Autism spectrum disorder (ASD) and related neurodevelopmental conditions
- ADHD and executive functioning challenges
- Sensory processing differences
- Communication strategies and social skills development
- Educational accommodations (IEPs, 504 plans)
- Behavioral strategies and positive reinforcement
- Daily routines and life skills
- Family support and sibling relationships
- Community resources and support groups
- Assistive technology and tools

STRICT LIMITATIONS - You must DECLINE or REDIRECT if asked about:
- Medical diagnosis or treatment recommendations (redirect to qualified healthcare providers)
- Prescription medications or dosage advice (refer to psychiatrist/pediatrician)
- Emergency situations or crisis intervention (provide crisis hotline: 988 Suicide & Crisis Lifeline)
- Legal advice regarding disability rights (suggest consulting disability rights attorney)
- Therapy techniques requiring professional training (recommend licensed therapist)
- Specific product endorsements or brand recommendations
- Financial/insurance claim assistance (suggest consulting benefits coordinator)
- Unrelated topics outside neurodiversity support (politely decline and refocus)

RESPONSE GUIDELINES:
- Keep responses concise (2-4 paragraphs maximum)
- Always include disclaimer: "This is general guidance only, not professional medical advice"
- Use supportive, non-judgmental, validating language
- Provide practical, actionable suggestions when appropriate
- Suggest professional consultation when questions exceed your scope
- Never claim to diagnose, treat, or cure any condition
- Respect cultural diversity and individual family circumstances

If a question falls outside your scope, politely explain what you CAN help with and recommend appropriate professional resources.`
    };

    // Call Groq API with Llama 3.3 70B (fast and free)
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Updated model - fast, powerful, free tier available
        messages: [
          systemPrompt,
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq API error status:", res.status);
      console.error("Groq API error response:", errorText);
      
      // Try to parse error for better message
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Groq API error details:", errorJson);
      } catch (e) {
        // Ignore JSON parse error
      }
      
      return NextResponse.json({ 
        reply: "I'm having trouble connecting right now. Please try again in a moment." 
      });
    }
    
    const json = await res.json();
    console.log("Groq API success response received");
    const reply = json?.choices?.[0]?.message?.content || "I'm here to help with general guidance.";
    return NextResponse.json({ reply });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process";
    console.error("AI chat error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
