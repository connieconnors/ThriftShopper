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
 * Fire-and-forget buyer event. No-op when logged out or table missing.
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
      if (!session?.access_token) return;

      await fetch('/api/buyer-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          event_type: eventType,
          listing_id: options.listingId ?? null,
          payload: options.payload ?? {},
        }),
        keepalive: true,
      });
    } catch {
      // Never block UX for analytics
    }
  })();
}
