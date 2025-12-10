# Stripe Connect Setup Guide

## Overview
ThriftShopper uses **Stripe Connect Standard Accounts** to handle seller payouts. This guide walks you through the setup process.

## Prerequisites
1. Stripe account (sign up at https://stripe.com)
2. Stripe API keys (get from Stripe Dashboard > Developers > API keys)
3. Environment variables configured

## Step 1: Database Setup

Run the SQL migration to add Stripe fields to the profiles table:

```sql
-- Run in Supabase SQL Editor
-- File: web/supabase/add-stripe-connect-fields.sql
```

This adds:
- `stripe_account_id` - Stores the Stripe Connect account ID
- `stripe_onboarding_status` - Tracks onboarding status (pending, completed, needs_verification)

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Stripe Webhook Secret (get from Stripe Dashboard > Developers > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

## Step 3: Stripe Dashboard Configuration

### 3.1 Enable Stripe Connect
1. Go to Stripe Dashboard > Settings > Connect
2. Enable "Standard accounts" (or "Express accounts" if preferred)
3. Configure your platform settings

### 3.2 Set Up Webhooks
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `account.updated` (required)
   - `checkout.session.completed` (optional, for order tracking)
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3.3 Test Mode vs Live Mode
- Use **Test mode** for development (keys start with `sk_test_` and `pk_test_`)
- Use **Live mode** for production (keys start with `sk_live_` and `pk_live_`)

## Step 4: Testing the Integration

### 4.1 Test Account Creation
1. Log in as a seller
2. Navigate to `/seller-dashboard`
3. Click "Set up payouts"
4. You should be redirected to Stripe's onboarding page

### 4.2 Test Onboarding Flow
1. Complete the Stripe onboarding form (use test data in test mode)
2. After completion, you'll be redirected back to your app
3. Check that the status shows "✓ Payouts Set Up"

### 4.3 Test Webhook
1. In Stripe Dashboard > Developers > Webhooks
2. Find your webhook endpoint
3. Click "Send test webhook"
4. Select `account.updated` event
5. Verify the webhook is received and processed

## Step 5: Update Payment Intent Creation

When creating payment intents for orders, you'll need to specify the connected account for payouts. Update `web/app/api/create-payment-intent/route.ts`:

```typescript
// Get seller's Stripe account ID
const { data: sellerProfile } = await supabase
  .from('profiles')
  .select('stripe_account_id')
  .eq('id', listing.seller_id)
  .single();

// Create payment intent with connected account
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: "usd",
  application_fee_amount: Math.round(amountInCents * 0.10), // 10% platform fee
  transfer_data: {
    destination: sellerProfile.stripe_account_id, // Seller's Stripe account
  },
  // ... rest of config
});
```

## Step 6: Compliance

Add this text to your seller onboarding/terms:

> **Payout Processing**: ThriftShopper uses Stripe to process payouts. You must complete Stripe's secure onboarding to receive sales proceeds. Stripe handles all identity verification and bank account setup securely.

## Troubleshooting

### "Unauthorized" error when clicking "Set up payouts"
- Check that the user is logged in
- Verify the Authorization header is being sent correctly
- Check server logs for detailed error messages

### Webhook not receiving events
- Verify webhook URL is accessible (not localhost in production)
- Check webhook secret is correct
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Account status not updating
- Check webhook is configured correctly
- Verify webhook handler is processing `account.updated` events
- Check database to see if `stripe_onboarding_status` is being updated

## Next Steps

1. ✅ Database migration
2. ✅ Environment variables
3. ✅ Stripe Dashboard configuration
4. ✅ Webhook setup
5. ⏳ Test onboarding flow
6. ⏳ Update payment intent creation for payouts
7. ⏳ Test end-to-end: order → payment → seller payout

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Standard Accounts](https://stripe.com/docs/connect/standard-accounts)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

