import { supabase } from './supabaseClient';

export const BUYER_EVENT_TYPES = [
  'listing_view',
  'favorite',
  'unfavorite',
  'search',
  'mood_select',
  'purchase',
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
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.id) return;

      const { error } = await supabase.from('buyer_events').insert({
        user_id: user.id,
        event_type: eventType,
        listing_id: options.listingId ?? null,
        payload: options.payload ?? {},
      });

      if (error) {
        console.warn('[buyer-events] insert failed:', error.message);
      }
    } catch (err) {
      console.warn('[buyer-events] unexpected error:', err);
    }
  })();
}
