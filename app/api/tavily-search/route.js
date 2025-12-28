import { NextResponse } from 'next/server';
import { tavily } from '@tavily/core';

export async function POST(request) {
    try {
        const { query } = await request.json();

        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey || apiKey === 'your_tavily_api_key_here') {
            return NextResponse.json(
                { error: 'Tavily API key not configured', code: 'API_KEY_MISSING' },
                { status: 503 }
            );
        }

        const client = tavily({ apiKey });

        // Search specifically on fahadimdad.com
        const response = await client.search(query, {
            includeRawContent: true,
            includeDomains: ['fahadimdad.com'],
            maxResults: 5
        });

        console.log('Tavily search results:', response);

        return NextResponse.json({ results: response });
    } catch (error) {
        console.error('Tavily API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search' },
            { status: 500 }
        );
    }
}
