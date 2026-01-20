// web/app/api/search/semantic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { semanticSearch } from '@/lib/semantic-search';
import type { Listing } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const supabaseService =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured for embeddings');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Embedding API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.data?.[0]?.embedding || [];
}

async function semanticEmbeddingSearch(query: string, limit: number): Promise<Listing[]> {
  if (!supabaseService) {
    return [];
  }

  try {
    const embedding = await generateEmbedding(query);
    if (!embedding.length) {
      return [];
    }

    const { data: matches, error } = await supabaseService.rpc('match_listings_by_mood', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    if (error || !matches || matches.length === 0) {
      if (error) {
        console.error('Semantic embedding RPC error:', error);
      }
      return [];
    }

    const ids: string[] = matches
      .map((match: { id: string }) => match.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      return [];
    }

    const { data: listings, error: listingsError } = await supabaseService
      .from('listings')
      .select(`
        *,
        profiles:seller_id (
          display_name,
          location_city,
          avatar_url,
          ts_badge,
          rating,
          review_count
        )
      `)
      .in('id', ids)
      .eq('status', 'active');

    if (listingsError || !listings) {
      if (listingsError) {
        console.error('Semantic embedding listings fetch error:', listingsError);
      }
      return [];
    }

    const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
    return ids.map((id) => listingMap.get(id)).filter(Boolean) as Listing[];
  } catch (error) {
    console.error('Semantic embedding search error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, limit } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const requestedLimit = limit || 24;
    const result = await semanticSearch(query, { limit: requestedLimit });

    const directListings = result.listings || [];
    let semanticListings: Listing[] = [];

    if (directListings.length < requestedLimit) {
      semanticListings = await semanticEmbeddingSearch(query, requestedLimit);
    }

    const seen = new Set(directListings.map((listing) => listing.id));
    const merged = [...directListings];
    semanticListings.forEach((listing) => {
      if (!seen.has(listing.id)) {
        merged.push(listing);
        seen.add(listing.id);
      }
    });

    if (result.interpretation) {
      console.log('🎤 Voice search input:', result.interpretation.originalQuery);
      console.log(
        '🧠 Extracted terms:',
        result.interpretation.termGroups.map((group) => group.term)
      );
    }
    if (result.debug) {
      console.log('🔎 Columns searched:', result.debug.columnsSearched.join(', '));
      console.log('📊 Term match counts:', result.debug.termMatchCounts);
      console.log('📦 Listings scanned:', result.debug.totalListingsScanned);
    }
    console.log('✅ Direct matches:', directListings.length);
    console.log('✨ Semantic matches added:', merged.length - directListings.length);
    console.log('🎯 Final result count:', merged.length);

    return NextResponse.json({
      ...result,
      listings: merged,
      debug: {
        ...result.debug,
        semanticMatchesAdded: merged.length - directListings.length,
      },
    });
  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs'; // Use Node.js runtime for OpenAI API calls

