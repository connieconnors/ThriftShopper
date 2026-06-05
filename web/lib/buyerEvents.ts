import { supabase } from './supabaseClient';

export const BUYER_EVENT_TYPES = [
  // v1
  'listing_view',
  'favorite',
  'unfavorite',
  'search',
  'mood_select',
  'purchase',
  // Tier A — taste graph
  'listing_impression',
  'listing_dwell',
  'listing_skip',
  'listing_click',
  'recommendation_impression',
  'recommendation_click',
  'search_no_results',
  'voice_search_start',
  'voice_search_cancel',
  // Tier B — funnel + intent
  'share',
  'contact_seller',
  'checkout_start',
  'clear_search',
  'clear_mood',
  'deck_reshuffle',
] as const;

export type BuyerEventType = (typeof BUYER_EVENT_TYPES)[number];

type TrackBuyerEventOptions = {
  listingId?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Fire-and-forget buyer event. Inserts with the user's Supabase session (RLS).
 * No-op when logged out. Never blocks UX.
 */
export function trackBuyerEvent(
  eventType: BuyerEventType,
  options: TrackBuyerEventOptions = {}
): void {
  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      if (!userId) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user?.id) return;
        userId = user.id;
      }

      const { error } = await supabase.from('buyer_events').insert({
        user_id: userId,
        event_type: eventType,
        listing_id: options.listingId ?? null,
        payload: options.payload ?? {},
      });

      if (error) {
        console.warn('[buyer-events] insert failed:', error.code, error.message);
      }
    } catch (err) {
      console.warn('[buyer-events] unexpected error:', err);
    }
  })();
}
