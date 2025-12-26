-- =============================================
-- DENORMALIZE SELLER STRIPE DATA TO LISTINGS
-- Run this in Supabase SQL Editor
-- =============================================

-- Add seller_stripe_account_id column to listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS seller_stripe_account_id TEXT;

-- Add seller_name column to listings (for UI display)
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS seller_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_seller_stripe_account_id 
ON public.listings(seller_stripe_account_id) 
WHERE seller_stripe_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.seller_stripe_account_id IS 'Denormalized Stripe Connect account ID from seller profile. Set when listing is published.';
COMMENT ON COLUMN public.listings.seller_name IS 'Denormalized seller display name from profile. Set when listing is published.';

