import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { RATE_LIMITERS, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const identifier = session.user.id || getClientIp(req) || "unknown";
  const canProceed = await RATE_LIMITERS.aiChat.checkLimit(identifier);
  if (!canProceed) {
    const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(identifier);
    return rateLimitResponse(retryAfter);
  }

  try {
    const { text, voice = "nova" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Limit text length to prevent abuse (OpenAI has 4096 char limit)
    const truncatedText = text.slice(0, 4096);

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      // Fallback: return empty response so browser TTS can be used
      return NextResponse.json({
        fallback: true,
        message: "OpenAI TTS not configured, using browser speech"
      });
    }

    // Valid OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
    // "nova" and "shimmer" are warm and friendly - perfect for kids
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const selectedVoice = validVoices.includes(voice) ? voice : "nova";

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd", // or "tts-1-hd" for higher quality
        input: truncatedText,
        voice: selectedVoice,
        response_format: "mp3",
        speed: 0.95, // Slightly slower for children to follow
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI TTS Error:", errorText);
      return NextResponse.json({
        fallback: true,
        message: "TTS generation failed, using browser speech"
      });
    }

    // Return the audio as a blob
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        // Prevent caching to ensure voice changes are respected
        // Each unique text+voice combination should generate fresh audio
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        // Include voice in response for debugging
        "X-Voice-Used": selectedVoice,
      },
    });

  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json({
      fallback: true,
      message: "TTS error, using browser speech"
    });
  }
}
