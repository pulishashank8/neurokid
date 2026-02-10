import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand, VoiceId, LanguageCode } from "@aws-sdk/client-polly";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rate-limit";

// Split text into chunks at sentence boundaries, respecting max length
function splitTextIntoChunks(text: string, maxLength: number = 2800): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = "";

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 <= maxLength) {
            currentChunk += (currentChunk ? " " : "") + sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk);
            // Handle sentences longer than maxLength
            if (sentence.length > maxLength) {
                const words = sentence.split(/\s+/);
                currentChunk = "";
                for (const word of words) {
                    if (currentChunk.length + word.length + 1 <= maxLength) {
                        currentChunk += (currentChunk ? " " : "") + word;
                    } else {
                        if (currentChunk) chunks.push(currentChunk);
                        currentChunk = word;
                    }
                }
            } else {
                currentChunk = sentence;
            }
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

// Valid Polly neural voices with language codes
const VOICE_CONFIG: Record<string, { voiceId: string; languageCode?: string }> = {
    "Ivy": { voiceId: "Ivy" },
    "Justin": { voiceId: "Justin" },
    "Kevin": { voiceId: "Kevin" },
    "Joanna": { voiceId: "Joanna" },
    "Matthew": { voiceId: "Matthew" },
    "Salli": { voiceId: "Salli" },
    "Kajal": { voiceId: "Kajal", languageCode: "hi-IN" },      // Hindi
    "Kajal-en": { voiceId: "Kajal", languageCode: "en-IN" },   // Indian English
};

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        const canProceed = await RATE_LIMITERS.aiChat.checkLimit(session.user.id);
        if (!canProceed) {
            const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(session.user.id);
            return rateLimitResponse(retryAfter);
        }

        const { text, voice = "Ivy" } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
        }

        // Get voice configuration
        const voiceConfig = VOICE_CONFIG[voice] || VOICE_CONFIG["Ivy"];
        const selectedVoice = voiceConfig.voiceId;
        const languageCode = voiceConfig.languageCode;

        const accessKey = process.env.AWS_ACCESS_KEY_ID;
        const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
        const region = process.env.AWS_REGION;

        // Debug logging removed - using structured logging in production

        if (!accessKey || !secretKey || !region) {
            return new Response(
                JSON.stringify({ error: "Missing AWS environment variables" }),
                { status: 500 }
            );
        }

        const client = new PollyClient({
            region,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
        });

        // Split text into chunks to handle Polly's 3000 char limit for neural voices
        const chunks = splitTextIntoChunks(text);
        // Debug logging removed - using structured logging in production

        const audioBuffers: Buffer[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const command = new SynthesizeSpeechCommand({
                Text: chunks[i],
                OutputFormat: "mp3",
                VoiceId: selectedVoice as VoiceId,
                Engine: "neural",
                ...(languageCode && { LanguageCode: languageCode as LanguageCode }),
            });

            const response = await client.send(command);

            if (!response.AudioStream) {
                throw new Error(`No audio stream returned for chunk ${i + 1}`);
            }

            const buffer = Buffer.from(await response.AudioStream.transformToByteArray());
            audioBuffers.push(buffer);
        }

        // Concatenate all audio buffers
        const combinedAudio = Buffer.concat(audioBuffers);

        return new Response(combinedAudio, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error) {
        console.error("Polly TTS Error:", error);
        const message = error instanceof Error ? error.message : 'TTS processing failed';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
