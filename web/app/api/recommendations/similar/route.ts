import { NextRequest, NextResponse } from 'next/server';
import {
  fetchListingById,
  parseEmbeddingVector,
  recommendFromEmbedding,
} from '@/lib/embeddingRecommendations';
import { getServiceSupabase } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listingId =
      typeof body?.listing_id === 'string' ? body.listing_id.trim() : '';
    const limit =
      typeof body?.limit === 'number' && body.limit > 0
        ? Math.min(body.limit, 16)
        : 8;

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const listing = await fetchListingById(supabase, listingId);
    if (!listing) {
      return NextResponse.json({ listings: [] });
    }

    const embedding = parseEmbeddingVector(listing.embedding);
    if (!embedding) {
      return NextResponse.json({ listings: [] });
    }

    const listings = await recommendFromEmbedding(supabase, embedding, {
      threshold: 0.5,
      limit,
      excludeIds: [listingId],
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('[similar] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
