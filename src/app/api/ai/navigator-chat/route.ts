import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const canProceed = await RATE_LIMITERS.aiChat.checkLimit(session.user.id);
        if (!canProceed) {
            const retryAfter = await RATE_LIMITERS.aiChat.getRetryAfter(session.user.id);
            return rateLimitResponse(retryAfter);
        }

        const { messages, userContext } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
        }

        const { state, county, zipCode, ageRange } = userContext;

        const systemPrompt = `
      You are the NeuroKid Support Assistant, a specialized AI for guiding parents of autistic children through the diagnosis and therapy process.
      Your goal is to provide 100% correct, supportive, and local information based on the user's location.
      
      User Context:
      - Location: ${county} County, ${state} (ZIP: ${zipCode})
      - Child's Age: ${ageRange} years
      
      Instructions:
      1. When asked about doctors, pediatricians, or therapists, emphasize checking the specific insurance networks and local office locators provided in the steps.
      2. If asked about Medicare/Medicaid in ${state}, refer to state-specific programs (e.g. Medi-Cal for CA, STAR Kids for TX).
      3. Always encourage and never give medical diagnoses.
      4. Provide specific timelines: mention that waitlists for specialists can be 2-8 months and insurance approval can take 30-45 days.
      5. Remind them they are not alone and suggest connecting with others in the community.
      6. Use a compassionate, clear, and professional tone.
    `;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
    }
}
