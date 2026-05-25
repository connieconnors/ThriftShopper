-- =============================================
-- ADD shipping snapshot columns to orders
-- Run in Supabase SQL Editor before deploying checkout shipping charges
-- =============================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS item_subtotal NUMERIC(10,2);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10,2);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_policy TEXT;

COMMENT ON COLUMN public.orders.item_subtotal IS 'Item price at checkout (excludes shipping). Marketplace fee applies to this amount only.';
COMMENT ON COLUMN public.orders.shipping_amount IS 'Shipping charged to buyer at checkout (0 for free or local pickup).';
COMMENT ON COLUMN public.orders.shipping_policy IS 'JSON snapshot of shipping preferences at time of order.';
COMMENT ON COLUMN public.orders.amount IS 'Buyer total charged (item_subtotal + shipping_amount).';
