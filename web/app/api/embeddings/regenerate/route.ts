// web/app/api/embeddings/regenerate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

/**
 * Regenerate embeddings for all listings
 * Includes keywords field (highest priority) in embedding text
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: 'Supabase service not configured' },
        { status: 500 }
      );
    }

    const { dryRun = false, limit = null } = await request.json().catch(() => ({}));

    // Fetch all active listings
    let query = supabaseService
      .from('listings')
      .select('id, title, description, styles, moods, intents, keywords, ai_suggested_keywords, category, story_text')
      .eq('status', 'active');

    if (limit) {
      query = query.limit(limit);
    }

    const { data: listings, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching listings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        message: 'No listings found',
        processed: 0,
        errors: [],
      });
    }

    if (dryRun) {
      // Show sample of what would be regenerated
      const sample = listings.slice(0, 3).map((listing: Listing) => {
        const styles = (listing.styles || []).join(' ');
        const embeddingText = `${listing.title || ''} ${listing.description || ''} ${styles} ${listing.category || ''} ${listing.story_text || ''}`.trim();
        return {
          id: listing.id,
          title: listing.title,
          styles: listing.styles,
          embeddingText: embeddingText.substring(0, 200) + '...',
        };
      });

      return NextResponse.json({
        message: 'Dry run - no embeddings regenerated',
        totalListings: listings.length,
        sample,
      });
    }

    // Regenerate embeddings
    const results = {
      processed: 0,
      errors: [] as Array<{ id: string; error: string }>,
      success: 0,
    };

    for (const listing of listings) {
      try {
        // Build embedding text with styles (highest priority - keyword data is stored here)
        const styles = (listing.styles || []).join(' ');
        
        const embeddingText = [
          listing.title || '',
          listing.description || '',
          styles,
          listing.category || '',
          listing.story_text || '',
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (!embeddingText) {
          results.errors.push({
            id: listing.id,
            error: 'No text content to generate embedding',
          });
          continue;
        }

        const embedding = await generateEmbedding(embeddingText);

        if (!embedding || embedding.length === 0) {
          results.errors.push({
            id: listing.id,
            error: 'Failed to generate embedding',
          });
          continue;
        }

        // Update listing with new embedding
        const { error: updateError } = await supabaseService
          .from('listings')
          .update({ embedding })
          .eq('id', listing.id);

        if (updateError) {
          results.errors.push({
            id: listing.id,
            error: updateError.message,
          });
        } else {
          results.success++;
        }

        results.processed++;
      } catch (error) {
        results.errors.push({
          id: listing.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.processed} listings`,
      totalListings: listings.length,
      success: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Embedding regeneration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
