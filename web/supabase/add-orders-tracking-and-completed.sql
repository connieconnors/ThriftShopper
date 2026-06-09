-- Optional tracking + completion timestamps for seller order flow.
-- Run in Supabase SQL Editor.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.tracking_number IS 'Carrier tracking number; optional when marking shipped.';
COMMENT ON COLUMN public.orders.shipped_at IS 'When seller marked the order shipped.';
COMMENT ON COLUMN public.orders.completed_at IS 'When seller marked pickup/manual/transaction complete.';
