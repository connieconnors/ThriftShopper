-- =============================================
-- ADD STRIPE CONNECT FIELDS TO PROFILES
-- Run this in Supabase SQL Editor
-- =============================================

-- Add Stripe Connect account ID (stores the connected account ID from Stripe)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add Stripe onboarding status (pending, completed, needs_verification)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_onboarding_status TEXT DEFAULT 'pending';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON public.profiles(stripe_account_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Connect account ID for seller payouts';
COMMENT ON COLUMN public.profiles.stripe_onboarding_status IS 'Stripe Connect onboarding status: pending, completed, needs_verification';

