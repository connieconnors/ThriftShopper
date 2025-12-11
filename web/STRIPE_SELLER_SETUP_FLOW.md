# Stripe Seller Setup Flow - Quick Guide

## Complete Flow for Tomorrow's Demo

### Step 1: Seller Signs Up & Completes Onboarding
- Seller signs up at `/signup?seller=true`
- Completes seller onboarding form
- Redirects to `/seller-dashboard`

### Step 2: Set Up Stripe Payouts
- In seller dashboard, they'll see "Set Up Payouts" card
- Click "Set Up Payouts" button
- **What happens:**
  1. Creates Stripe Connect account (if doesn't exist)
  2. Generates Stripe onboarding link
  3. Redirects seller to Stripe's secure onboarding page

### Step 3: Complete Stripe Onboarding
- Seller fills out Stripe's form:
  - Business/Personal info
  - Bank account details
  - Identity verification (if required)
- Stripe handles all security/verification
- Seller completes and returns to your app

### Step 4: Automatic Status Update
- Stripe webhook automatically updates `stripe_onboarding_status` to `completed`
- Seller dashboard shows "✓ Payouts Set Up" (green checkmark)
- Seller is now ready to receive payments!

## What You Need to Verify

### 1. Environment Variables
Make sure `.env.local` has:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Stripe Webhook Configuration
- **For Production**: Set up webhook in Stripe Dashboard
  - Endpoint: `https://yourdomain.com/api/stripe/webhook`
  - Events: `account.updated`
  - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

- **For Local Testing**: Use Stripe CLI
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
  Copy the webhook secret it gives you to `.env.local`

### 3. Database Columns
Make sure these columns exist in `profiles`:
- `stripe_account_id` (text)
- `stripe_onboarding_status` (text)

## Testing the Flow

### Test 1: Create Account Link
1. Go to seller dashboard
2. Click "Set Up Payouts"
3. Should redirect to Stripe onboarding page
4. Check database - `stripe_account_id` should be populated

### Test 2: Complete Onboarding
1. Complete Stripe onboarding (use test data)
2. Return to app
3. Check database - `stripe_onboarding_status` should be `completed`
4. Dashboard should show green "✓ Payouts Set Up"

### Test 3: Payment Flow
1. Try to create a payment intent for seller's listing
2. Should work if `stripe_onboarding_status = 'completed'`
3. Should show error if not completed

## Troubleshooting

**"Set Up Payouts" button doesn't work:**
- Check browser console for errors
- Verify `STRIPE_SECRET_KEY` is set
- Check that seller is logged in

**Status doesn't update after onboarding:**
- Check webhook is configured
- Check `STRIPE_WEBHOOK_SECRET` is set
- Check Stripe Dashboard → Webhooks → See if events are being received
- For local: Make sure Stripe CLI is running

**Payment fails with "Seller has not completed payout setup":**
- Check `stripe_onboarding_status` in database
- Should be `completed`, not `pending` or `needs_verification`
- If stuck, manually update in Supabase:
  ```sql
  UPDATE public.profiles
  SET stripe_onboarding_status = 'completed'
  WHERE user_id = 'SELLER_USER_ID';
  ```

## Quick Checklist for Demo

- [ ] `.env.local` has all Stripe keys
- [ ] Webhook is configured (or Stripe CLI running for local)
- [ ] Test the flow yourself first
- [ ] Have seller's email ready to mark as founding seller after signup
- [ ] Know how to check `stripe_onboarding_status` in Supabase

---

**You're ready!** The flow should work smoothly. The seller clicks "Set Up Payouts", completes Stripe's form, and they're done!

