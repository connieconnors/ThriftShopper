-- =============================================
-- BACKFILL SELLER STRIPE DATA ON EXISTING LISTINGS
-- Run this AFTER add-seller-stripe-to-listings.sql
-- =============================================

-- Update existing active listings with seller's stripe_account_id and display_name
UPDATE public.listings l
SET 
  seller_stripe_account_id = p.stripe_account_id,
  seller_name = p.display_name
FROM public.profiles p
WHERE 
  l.seller_id = p.user_id
  AND l.status = 'active'
  AND p.stripe_account_id IS NOT NULL
  AND (l.seller_stripe_account_id IS NULL OR l.seller_name IS NULL);

-- Show how many listings were updated
SELECT 
  COUNT(*) as updated_listings,
  COUNT(DISTINCT seller_id) as sellers_affected
FROM public.listings
WHERE 
  status = 'active'
  AND seller_stripe_account_id IS NOT NULL;

