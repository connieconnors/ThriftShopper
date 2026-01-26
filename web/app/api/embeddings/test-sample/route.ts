// web/app/api/embeddings/test-sample/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const supabaseService =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * Get sample product records to verify keywords field is populated
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: 'Supabase service not configured' },
        { status: 500 }
      );
    }

    const { limit = 5 } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const { data: listings, error } = await supabaseService
      .from('listings')
      .select('id, title, description, styles, moods, intents, keywords, ai_suggested_keywords, category, story_text, embedding')
      .eq('status', 'active')
      .limit(parseInt(limit as string, 10));

    if (error) {
      console.error('Error fetching sample listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      );
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        message: 'No listings found',
        samples: [],
      });
    }

    // Format samples for easy inspection
    const samples = listings.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      styles: listing.styles, // Highest priority - keyword data stored here
      moods: listing.moods,
      intents: listing.intents,
      keywords: listing.keywords,
      ai_suggested_keywords: listing.ai_suggested_keywords,
      category: listing.category,
      hasEmbedding: !!listing.embedding,
      embeddingLength: listing.embedding ? listing.embedding.length : 0,
      // Show what would be searched (styles first - highest priority)
      searchableText: [
        listing.title || '',
        listing.description || '',
        ...(listing.styles || []), // Styles first - keyword data stored here
        listing.category || '',
        listing.story_text || '',
      ]
        .filter(Boolean)
        .join(' ')
        .substring(0, 300),
    }));

    return NextResponse.json({
      message: `Found ${listings.length} sample listings`,
      samples,
    });
  } catch (error) {
    console.error('Test sample error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch samples',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
