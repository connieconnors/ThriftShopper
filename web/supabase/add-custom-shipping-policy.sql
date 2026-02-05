-- Add optional listing-level shipping policy override.
-- When set, product detail page shows this instead of the seller's default (profiles.shipping_info).
-- Sellers can set it in the upload flow via "Make changes to your shipping banner for this item?"
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS custom_shipping_policy TEXT DEFAULT NULL;

COMMENT ON COLUMN public.listings.custom_shipping_policy IS 'Optional per-listing shipping banner text. If set, shown on product page instead of seller default (profiles.shipping_info). Use newline for two lines (e.g. line1 + line2).';
