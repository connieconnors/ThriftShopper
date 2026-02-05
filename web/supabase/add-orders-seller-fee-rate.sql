-- =============================================
-- ADD seller_fee_rate TO ORDERS (marketplace fee tracking)
-- Run in Supabase SQL Editor
-- =============================================
-- Captures the seller's fee rate at time of order for historical accuracy
-- even if their profile rate changes later. Fee amounts are computed in
-- create-order and webhook: platform_fee_amount, seller_payout_amount.
-- =============================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_fee_rate NUMERIC(5,4);

-- Ensure platform_fee_amount and seller_payout_amount exist (add if missing)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_payout_amount NUMERIC(10,2);

COMMENT ON COLUMN public.orders.seller_fee_rate IS 'Seller marketplace fee rate at time of order (e.g. 0, 0.04). Snapshot from profiles.seller_fee_rate.';
COMMENT ON COLUMN public.orders.platform_fee_amount IS 'Platform fee (amount × seller_fee_rate) in dollars.';
COMMENT ON COLUMN public.orders.seller_payout_amount IS 'Expected seller net in dollars: amount - platform_fee_amount - estimated Stripe processing.';
