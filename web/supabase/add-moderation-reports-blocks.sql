-- User-generated content moderation (App Store Guideline 1.2)
-- Run in Supabase SQL Editor before deploying report/block UI.

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_status_created_idx
  ON public.reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_reported_user_idx
  ON public.reports (reported_user_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

GRANT SELECT, INSERT ON public.reports TO authenticated;

-- Blocked users: hide seller content from blocker's feed instantly (client + API filter)
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx
  ON public.user_blocks (blocker_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_blocks_insert_own" ON public.user_blocks;
CREATE POLICY "user_blocks_insert_own"
  ON public.user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "user_blocks_select_own" ON public.user_blocks;
CREATE POLICY "user_blocks_select_own"
  ON public.user_blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "user_blocks_delete_own" ON public.user_blocks;
CREATE POLICY "user_blocks_delete_own"
  ON public.user_blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;

COMMENT ON TABLE public.reports IS
  'User reports of listings or sellers; reviewed by ThriftShopper within 24 hours.';

COMMENT ON TABLE public.user_blocks IS
  'Buyer blocks of sellers; blocked listings hidden from blocker feed immediately.';
