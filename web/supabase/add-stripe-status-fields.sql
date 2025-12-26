-- =============================================
-- ADD STRIPE STATUS FIELDS TO PROFILES
-- Run this in Supabase SQL Editor
-- =============================================

-- Add Stripe status fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_onboarded_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.stripe_charges_enabled IS 'Whether the Stripe account can accept charges';
COMMENT ON COLUMN public.profiles.stripe_payouts_enabled IS 'Whether the Stripe account can receive payouts';
COMMENT ON COLUMN public.profiles.stripe_details_submitted IS 'Whether all required Stripe onboarding details have been submitted';
COMMENT ON COLUMN public.profiles.stripe_onboarded_at IS 'Timestamp when Stripe onboarding was completed';

