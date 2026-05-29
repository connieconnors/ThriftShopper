-- =============================================
-- ORDERS: columns required by checkout (create-order + webhook)
-- Run in Supabase SQL Editor if order creation fails after successful payment.
-- Safe to re-run (IF NOT EXISTS).
-- =============================================

-- Core checkout references
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS listing_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Shipping snapshot (flat columns used by create-order)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

-- Price breakdown (add-orders-shipping-snapshot.sql)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_subtotal NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_policy TEXT;

-- Fee snapshot (add-orders-seller-fee-rate.sql)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_fee_rate NUMERIC(5,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_payout_amount NUMERIC(10,2);

-- Helpful index for idempotent order creation
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_intent_id_key
  ON public.orders (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
