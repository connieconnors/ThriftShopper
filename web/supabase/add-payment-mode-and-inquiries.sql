-- Payment modes for local / non-Stripe sellers (QA: Wilson's Dry Dock)
-- Run in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'stripe_checkout';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_pickup_label TEXT;

COMMENT ON COLUMN public.profiles.payment_mode IS
  'stripe_checkout | reserve_in_store | contact_seller';

COMMENT ON COLUMN public.profiles.payment_pickup_label IS
  'In-store pay location shown to buyers, e.g. Wilson''s Dry Dock';

CREATE TABLE IF NOT EXISTS public.listing_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('reserve', 'contact')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reserved', 'sold', 'cancelled')),
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  message TEXT,
  pickup_location_name TEXT,
  listing_title TEXT,
  listing_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_inquiries_seller_id_idx
  ON public.listing_inquiries (seller_id);

CREATE INDEX IF NOT EXISTS listing_inquiries_buyer_id_idx
  ON public.listing_inquiries (buyer_id);

CREATE INDEX IF NOT EXISTS listing_inquiries_listing_id_idx
  ON public.listing_inquiries (listing_id);

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can create inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Buyers can view own inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Sellers can view their inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Sellers can update their inquiries" ON public.listing_inquiries;

CREATE POLICY "Buyers can create inquiries"
  ON public.listing_inquiries FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view own inquiries"
  ON public.listing_inquiries FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their inquiries"
  ON public.listing_inquiries FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their inquiries"
  ON public.listing_inquiries FOR UPDATE
  USING (auth.uid() = seller_id);

GRANT SELECT, INSERT, UPDATE ON public.listing_inquiries TO authenticated;

-- Example: Wilson's Dry Dock (replace user_id with seller UUID)
-- UPDATE public.profiles
-- SET payment_mode = 'reserve_in_store',
--     payment_pickup_label = 'Wilson''s Dry Dock'
-- WHERE display_name ILIKE '%Wilson%Dry Dock%';
