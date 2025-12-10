// web/app/api/search/semantic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/semantic-search';

export async function POST(request: NextRequest) {
  try {
    const { query, limit } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await semanticSearch(query, { limit: limit || 24 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs'; // Use Node.js runtime for OpenAI API calls

