-- Per-listing buyer action override (shop default lives on profiles.seller_action_type)
-- Run in Supabase SQL Editor.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_action_type TEXT;

COMMENT ON COLUMN public.listings.seller_action_type IS
  'Optional override: stripe_checkout | local_pickup | store_pickup | contact_seller. NULL = use seller shop default.';

-- Refresh discoverable_listings view to expose override on listing detail/browse
DROP VIEW IF EXISTS public.discoverable_listings;

CREATE VIEW public.discoverable_listings AS
SELECT id,
  seller_id,
  title,
  description,
  price,
  category,
  condition,
  moods,
  original_image_url,
  clean_image_url,
  staged_image_url,
  created_at,
  status,
  intents,
  styles,
  ai_generated_title,
  ai_generated_description,
  user_edited_title,
  user_edited_description,
  ebay_min_price,
  ebay_max_price,
  ebay_avg_price,
  ebay_recent_sales,
  ebay_last_checked,
  updated_at,
  keywords,
  specifications,
  embedding,
  additional_image_url,
  additional_image_two_url,
  seller_stripe_account_id,
  seller_name,
  price_basis,
  price_confidence,
  price_last_updated_at,
  enriched_description,
  era,
  material,
  ai_metadata,
  is_verified,
  story_text,
  story_summary,
  story_source,
  story_updated_at,
  ai_suggested_keywords,
  seller_reference,
  seller_notes,
  custom_shipping_policy,
  seller_action_type,
  sold_at
FROM listings
WHERE status = 'active'::text OR (status = 'sold'::text AND (sold_at > (now() - '14 days'::interval) OR sold_at IS NULL));
