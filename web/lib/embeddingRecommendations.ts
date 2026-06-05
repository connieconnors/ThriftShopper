import type { SupabaseClient } from '@supabase/supabase-js';
import type { Listing } from './types';

const LISTING_SELECT = `
  *,
  profiles:seller_id (
    display_name,
    location_city,
    avatar_url,
    ts_badge,
    rating,
    review_count
  )
`;

export function parseEmbeddingVector(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    return raw.every((n) => typeof n === 'number') ? (raw as number[]) : null;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')) {
        return parsed as number[];
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function averageEmbeddings(vectors: number[][]): number[] | null {
  if (vectors.length === 0) return null;
  const dim = vectors[0].length;
  if (!dim) return null;

  const sum = new Array(dim).fill(0);
  for (const vector of vectors) {
    if (vector.length !== dim) continue;
    for (let i = 0; i < dim; i++) sum[i] += vector[i];
  }
  return sum.map((value) => value / vectors.length);
}

type MatchOptions = {
  threshold?: number;
  limit?: number;
  excludeIds?: string[];
};

export async function matchListingsByEmbedding(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  options: MatchOptions = {}
): Promise<{ id: string; similarity: number }[]> {
  const { threshold = 0.55, limit = 12, excludeIds = [] } = options;
  const exclude = new Set(excludeIds);

  const { data, error } = await supabase.rpc('match_listings_by_mood', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit + excludeIds.length + 4,
  });

  if (error || !data) {
    if (error) console.error('[recommendations] RPC error:', error.message);
    return [];
  }

  return (data as { id: string; similarity?: number }[])
    .filter((row) => row.id && !exclude.has(row.id))
    .slice(0, limit)
    .map((row) => ({ id: row.id, similarity: row.similarity ?? 0 }));
}

export async function fetchEmbeddingsForListingIds(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<number[][]> {
  if (listingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('id, embedding')
    .in('id', listingIds)
    .eq('status', 'active');

  if (error || !data) {
    if (error) console.error('[recommendations] embedding fetch error:', error.message);
    return [];
  }

  const vectors: number[][] = [];
  for (const row of data) {
    const parsed = parseEmbeddingVector(row.embedding);
    if (parsed?.length) vectors.push(parsed);
  }
  return vectors;
}

export async function fetchListingById(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ id: string; embedding: unknown } | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, embedding')
    .eq('id', listingId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchFullListingsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Listing[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', ids)
    .eq('status', 'active');

  if (error || !data) {
    if (error) console.error('[recommendations] listings fetch error:', error.message);
    return [];
  }

  const listingMap = new Map((data as Listing[]).map((listing) => [listing.id, listing]));
  return ids.map((id) => listingMap.get(id)).filter((l): l is Listing => Boolean(l));
}

export async function recommendFromEmbedding(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  options: MatchOptions = {}
): Promise<Listing[]> {
  const matches = await matchListingsByEmbedding(supabase, queryEmbedding, options);
  const ids = matches.map((m) => m.id);
  return fetchFullListingsByIds(supabase, ids);
}
