import { NextRequest, NextResponse } from 'next/server';
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    const logger = createLogger({ context: 'NPI Proxy' });
    try {
        // Rate limit by IP to prevent abuse
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'anonymous';

        const canProceed = await RATE_LIMITERS.searchProviders.checkLimit(ip);
        if (!canProceed) {
            const retryAfter = await RATE_LIMITERS.searchProviders.getRetryAfter(ip);
            return rateLimitResponse(retryAfter);
        }

        const { searchParams } = new URL(request.url);
        const npiParams = new URLSearchParams(searchParams);

        const targetUrl = `https://npiregistry.cms.hhs.gov/api/?${npiParams.toString()}`;
        logger.debug({ targetUrl }, 'NPI Proxy fetching');

        // Forward the request to NPPES API
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        logger.debug({ status: response.status }, 'NPI Proxy response');

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error({ errorBody, status: response.status }, 'NPPES API Error');
            return NextResponse.json({ error: 'Failed to fetch from NPI Registry', details: errorBody }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        logger.error({ error }, 'NPI Proxy Error');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
