-- =============================================
-- ADD FOUNDING SELLER FIELDS TO PROFILES
-- Run this in Supabase SQL Editor
-- =============================================

-- Add is_founding_seller flag
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_founding_seller BOOLEAN DEFAULT FALSE;

-- Add founding_seller_start_date to track when 6-month period started
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS founding_seller_start_date TIMESTAMPTZ;

-- Add transaction_fee_percent to store the seller's fee rate (0 for founding, 0.04 for regular)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS transaction_fee_percent DECIMAL(5,4) DEFAULT 0.04;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_founding_seller ON public.profiles(is_founding_seller);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.is_founding_seller IS 'True for founding sellers (no fee for 6 months)';
COMMENT ON COLUMN public.profiles.founding_seller_start_date IS 'Date when founding seller status started (for 6-month calculation)';
COMMENT ON COLUMN public.profiles.transaction_fee_percent IS 'Transaction fee percentage (0.00 for founding sellers, 0.04 for regular)';

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('is_founding_seller', 'founding_seller_start_date', 'transaction_fee_percent')
ORDER BY column_name;

