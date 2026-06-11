-- Buyer-facing seller notes (pickup, hours, address — optional, max 200 chars in UI)
-- Run in Supabase SQL Editor before deploying Seller Quick View.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_notes TEXT;

COMMENT ON COLUMN public.profiles.display_notes IS
  'Optional notes for buyers (hours, pickup, address). Shown in Seller Quick View on listings.';

-- PostgREST: table-level grants (new columns inherit; avoids column-grant narrowing).
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- RLS: existing "Profiles are viewable by everyone" + "Users can update own profile" cover this column.
-- Re-affirm update policy scope (no change if already present).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
