-- Taste graph Tier A — extend buyer_events event types
-- Run in Supabase SQL Editor after buyer-events.sql

ALTER TABLE public.buyer_events
  DROP CONSTRAINT IF EXISTS buyer_events_event_type_check;

ALTER TABLE public.buyer_events
  ADD CONSTRAINT buyer_events_event_type_check CHECK (
    event_type IN (
      'listing_view',
      'favorite',
      'unfavorite',
      'search',
      'mood_select',
      'purchase',
      'listing_impression',
      'listing_dwell',
      'listing_skip',
      'listing_click',
      'recommendation_impression',
      'recommendation_click',
      'search_no_results',
      'voice_search_start',
      'voice_search_cancel'
    )
  );
