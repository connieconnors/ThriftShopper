# Stripe Database Setup - Quick Guide

## Step 1: Run SQL Migration in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run** (or press Ctrl+Enter)

```sql
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
```

## Step 2: Verify Columns Were Added

After running the SQL, verify the columns exist:

1. Go to **Table Editor** in Supabase
2. Select the `profiles` table
3. Check that you see:
   - `stripe_account_id` (text, nullable)
   - `stripe_onboarding_status` (text, default: 'pending')

## What These Columns Do

- **`stripe_account_id`**: Stores the Stripe Connect account ID for each seller. This is created when they click "Set up payouts" and is used to route payments to them.

- **`stripe_onboarding_status`**: Tracks whether the seller has completed Stripe onboarding:
  - `pending` - Not started or in progress
  - `completed` - Fully onboarded and can receive payouts
  - `needs_verification` - Additional verification required by Stripe

## Next Steps

After running this migration:
1. ✅ Sellers can click "Set up payouts" on their dashboard
2. ✅ System will create Stripe Connect accounts
3. ✅ Payments will be split: 10% platform fee, 90% to seller
4. ✅ Webhooks will update `stripe_onboarding_status` automatically

## Troubleshooting

**Error: "column already exists"**
- This is fine! The `IF NOT EXISTS` clause means it's safe to run multiple times.
- If you see this, the columns are already added.

**Error: "permission denied"**
- Make sure you're using the SQL Editor (not the Table Editor)
- You need admin access to your Supabase project

