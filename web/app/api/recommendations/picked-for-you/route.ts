import { NextResponse } from 'next/server';
import {
  averageEmbeddings,
  fetchEmbeddingsForListingIds,
  recommendFromEmbedding,
} from '@/lib/embeddingRecommendations';
import { getCurrentUserId, getServiceSupabase } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (favError) {
      console.error('[picked-for-you] favorites error:', favError.message);
      return NextResponse.json({ listings: [] });
    }

    const favoriteIds = (favorites ?? [])
      .map((row) => row.listing_id as string)
      .filter(Boolean);

    if (favoriteIds.length < 2) {
      return NextResponse.json({ listings: [] });
    }

    const embeddingVectors = await fetchEmbeddingsForListingIds(supabase, favoriteIds);
    if (embeddingVectors.length < 2) {
      return NextResponse.json({ listings: [] });
    }

    const tasteVector = averageEmbeddings(embeddingVectors);
    if (!tasteVector) {
      return NextResponse.json({ listings: [] });
    }

    const listings = await recommendFromEmbedding(supabase, tasteVector, {
      threshold: 0.55,
      limit: 12,
      excludeIds: favoriteIds,
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('[picked-for-you] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
