import type { Listing } from './types';
import { normalizeTagColumn } from './utils/tagNormalizer';

export const APP_VERSION = 'beta';

export type BuyerSurface =
  | 'browse'
  | 'canvas'
  | 'listing_detail'
  | 'search_results'
  | 'picked_for_you'
  | 'more_like_this'
  | 'favorites';

export type RecommendationType = 'picked_for_you' | 'more_like_this';

const BROWSE_SESSION_KEY = 'ts_browse_session_id';

/** One session id per browse visit (sessionStorage survives soft reload). */
export function getBrowseSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(BROWSE_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(BROWSE_SESSION_KEY, id);
  }
  return id;
}

export function listingSnapshot(listing: Listing) {
  return {
    moods: normalizeTagColumn(listing.moods),
    styles: normalizeTagColumn(listing.styles),
    intents: normalizeTagColumn(listing.intents),
    category: listing.category ?? '',
    price: typeof listing.price === 'number' ? listing.price : null,
    embedding_id: listing.id,
  };
}

export type EventPayloadInput = {
  surface?: BuyerSurface;
  position?: number;
  deckSize?: number;
  activeMoods?: string[];
  activeSearchQuery?: string;
  recommendationType?: RecommendationType;
  listing?: Listing | null;
  extra?: Record<string, unknown>;
};

export function buildEventPayload(input: EventPayloadInput = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    session_id: getBrowseSessionId(),
    client: 'web',
    app_version: APP_VERSION,
  };

  if (input.surface) payload.surface = input.surface;
  if (input.position !== undefined) payload.position = input.position;
  if (input.deckSize !== undefined) payload.deck_size = input.deckSize;
  if (input.activeMoods && input.activeMoods.length > 0) {
    payload.active_moods = input.activeMoods;
  }
  if (input.activeSearchQuery) payload.active_search_query = input.activeSearchQuery;
  if (input.recommendationType) payload.recommendation_type = input.recommendationType;
  if (input.listing) payload.listing_snapshot = listingSnapshot(input.listing);
  if (input.extra) Object.assign(payload, input.extra);

  return payload;
}

export function resolveDeckSurface(
  searchResults: Listing[] | null,
  listing: Listing | null | undefined,
  pickedIdSet: Set<string>
): BuyerSurface {
  if (searchResults !== null) return 'search_results';
  if (listing && pickedIdSet.has(listing.id)) return 'picked_for_you';
  return 'browse';
}
