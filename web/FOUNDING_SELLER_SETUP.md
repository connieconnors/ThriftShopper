# Founding Seller Setup Guide

## Overview
- **Founding Sellers**: 0% transaction fee for first 6 months
- **Regular Sellers**: 4% transaction fee

## Database Setup

### Step 1: Add Columns to Profiles Table
Run this SQL in Supabase SQL Editor:
```sql
-- See: web/supabase/add-founding-seller-fields.sql
```

This adds:
- `is_founding_seller` (boolean)
- `founding_seller_start_date` (timestamp)
- `transaction_fee_percent` (decimal, default 0.04)

## Marking Founding Sellers

### Option 1: Via SQL (Recommended for initial setup)
Run this in Supabase SQL Editor:
```sql
-- Mark a specific seller as founding
UPDATE public.profiles
SET 
  is_founding_seller = TRUE,
  founding_seller_start_date = NOW(),
  transaction_fee_percent = 0.00
WHERE user_id = 'SELLER_USER_ID_HERE';
```

### Option 2: Via Supabase Dashboard
1. Go to Table Editor → `profiles`
2. Find the seller's row
3. Set:
   - `is_founding_seller` = `true`
   - `founding_seller_start_date` = Current timestamp
   - `transaction_fee_percent` = `0.00`

## How It Works

### Fee Calculation Logic:
1. **Founding Seller (within 6 months)**: 0% fee
2. **Founding Seller (after 6 months)**: 4% fee (or their `transaction_fee_percent`)
3. **Regular Seller**: 4% fee (or their `transaction_fee_percent`)

### Automatic Expiration:
The payment intent creation automatically checks:
- If `is_founding_seller = true`
- If `founding_seller_start_date` is within the last 6 months
- If yes → 0% fee
- If no → Uses `transaction_fee_percent` (default 4%)

## Testing

### Test Founding Seller:
1. Mark a test seller as founding seller
2. Create a payment intent
3. Check metadata - should show `platform_fee_percent: "0.00"`

### Test Regular Seller:
1. Ensure seller has `is_founding_seller = false` or `NULL`
2. Create a payment intent
3. Check metadata - should show `platform_fee_percent: "0.04"`

### Test Expired Founding Seller:
1. Mark seller as founding with `founding_seller_start_date` = 7 months ago
2. Create a payment intent
3. Should charge 4% fee (expired)

## Viewing Current Status

Run this SQL to see all sellers and their fee status:
```sql
SELECT 
  user_id,
  email,
  display_name,
  is_founding_seller,
  founding_seller_start_date,
  transaction_fee_percent,
  CASE 
    WHEN is_founding_seller = TRUE AND founding_seller_start_date IS NOT NULL THEN
      CASE 
        WHEN founding_seller_start_date > NOW() - INTERVAL '6 months' THEN 'Active (0% fee)'
        ELSE 'Expired (4% fee)'
      END
    ELSE 'Regular (4% fee)'
  END as fee_status
FROM public.profiles
WHERE is_seller = TRUE
ORDER BY created_at DESC;
```

## Notes

- The 6-month period starts from `founding_seller_start_date`
- After 6 months, the seller automatically gets charged the regular fee
- You can manually set `transaction_fee_percent` to override the default 4%
- All fee calculations happen in `/api/create-payment-intent`

