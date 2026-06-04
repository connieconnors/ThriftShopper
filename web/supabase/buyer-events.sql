-- Buyer behavior events (Winning #3 — data moat)
-- Run in Supabase SQL Editor on beta/prod before /api/buyer-events will persist rows.

CREATE TABLE IF NOT EXISTS public.buyer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  listing_id uuid REFERENCES public.listings (id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buyer_events_event_type_check CHECK (
    event_type IN (
      'listing_view',
      'favorite',
      'unfavorite',
      'search',
      'mood_select',
      'purchase'
    )
  )
);

CREATE INDEX IF NOT EXISTS buyer_events_user_created_idx
  ON public.buyer_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS buyer_events_type_created_idx
  ON public.buyer_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS buyer_events_listing_id_idx
  ON public.buyer_events (listing_id)
  WHERE listing_id IS NOT NULL;

COMMENT ON TABLE public.buyer_events IS
  'Logged-in buyer behavior: search, moods, favorites, views, purchases.';

ALTER TABLE public.buyer_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_events_select_own" ON public.buyer_events;
CREATE POLICY "buyer_events_select_own"
  ON public.buyer_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "buyer_events_insert_own" ON public.buyer_events;
CREATE POLICY "buyer_events_insert_own"
  ON public.buyer_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE for buyers in v1 (append-only log)

-- Required for client inserts (RLS alone is not enough without table grants)
GRANT SELECT, INSERT ON public.buyer_events TO authenticated;
