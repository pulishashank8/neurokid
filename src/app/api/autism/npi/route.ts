import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const npiParams = new URLSearchParams(searchParams);

        const targetUrl = `https://npiregistry.cms.hhs.gov/api/?${npiParams.toString()}`;
        console.log('NPI Proxy fetching:', targetUrl);

        // Forward the request to NPPES API
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        console.log('NPI Proxy response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('NPPES API Error Body:', errorBody);
            return NextResponse.json({ error: 'Failed to fetch from NPI Registry', details: errorBody }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('NPI Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
