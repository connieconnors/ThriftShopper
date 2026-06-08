-- Seller action types (refines payment_mode for local / store pickup)
-- Run in Supabase SQL Editor after add-payment-mode-and-inquiries.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_action_type TEXT DEFAULT 'stripe_checkout';

COMMENT ON COLUMN public.profiles.seller_action_type IS
  'stripe_checkout | local_pickup | store_pickup | contact_seller';

-- Migrate legacy payment_mode / reserve_pickup values
UPDATE public.profiles
SET seller_action_type = CASE
  WHEN payment_mode = 'reserve_in_store' AND payment_pickup_label IS NOT NULL
    THEN 'store_pickup'
  WHEN payment_mode = 'reserve_in_store' THEN 'local_pickup'
  WHEN seller_action_type = 'reserve_pickup' AND payment_pickup_label IS NOT NULL
    THEN 'store_pickup'
  WHEN seller_action_type = 'reserve_pickup' THEN 'local_pickup'
  WHEN payment_mode = 'contact_seller' THEN 'contact_seller'
  WHEN payment_mode = 'stripe_checkout' THEN 'stripe_checkout'
  ELSE COALESCE(seller_action_type, 'stripe_checkout')
END
WHERE seller_action_type IS NULL
   OR seller_action_type IN ('reserve_pickup', 'stripe_checkout')
   AND (payment_mode IS NOT NULL OR payment_pickup_label IS NOT NULL);

-- Wilson's Dry Dock → store pickup
-- UPDATE public.profiles
-- SET seller_action_type = 'store_pickup',
--     payment_pickup_label = 'Wilson''s Dry Dock'
-- WHERE display_name ILIKE '%Wilson%Dry Dock%';
