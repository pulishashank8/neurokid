import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdvisorSummaryViaAgent } from '@/lib/owner/advisor-agent';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cached:
  | { data: Awaited<ReturnType<typeof getAdvisorSummaryViaAgent>> & { generatedAt: string }; expiresAt: number }
  | null = null;

/**
 * Owner Advisor API - AI-driven via reasoning engine.
 * Uses BUSINESS_ANALYST agent with goal-driven synthesis.
 * Caches results for 15 min. Use ?refresh=1 to bypass cache.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === '1';

  // Return cached result if valid and not forcing refresh
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({
      ...cached.data,
      fromCache: true,
    });
  }

  try {
    const summary = await getAdvisorSummaryViaAgent();
    const generatedAt = new Date().toISOString();
    cached = {
      data: { ...summary, generatedAt },
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return NextResponse.json({
      ...summary,
      generatedAt,
      fromCache: false,
    });
  } catch (error) {
    console.error('[Advisor] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error';
    const userMessage =
      message.includes('API') || message.includes('key') || message.includes('credentials')
        ? 'AI service is not configured or credentials are invalid. Check GROQ_API_KEY in your environment.'
        : message.includes('timeout') || message.includes('ETIMEDOUT')
          ? 'The analysis took too long. Try again in a moment.'
          : 'The AI advisor could not complete its analysis. You can refresh to try again.';
    return NextResponse.json(
      {
        error: 'Failed to fetch advisor summary',
        userMessage,
        details: message,
      },
      { status: 500 }
    );
  }
}
