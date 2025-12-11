-- =============================================
-- MARK A SELLER AS FOUNDING SELLER
-- Run this in Supabase SQL Editor
-- Replace 'SELLER_USER_ID_HERE' with the actual user_id
-- =============================================

-- Example: Mark a seller as founding seller
-- UPDATE public.profiles
-- SET 
--   is_founding_seller = TRUE,
--   founding_seller_start_date = NOW(),
--   transaction_fee_percent = 0.00
-- WHERE user_id = 'SELLER_USER_ID_HERE';

-- To mark multiple founding sellers at once:
-- UPDATE public.profiles
-- SET 
--   is_founding_seller = TRUE,
--   founding_seller_start_date = NOW(),
--   transaction_fee_percent = 0.00
-- WHERE user_id IN (
--   'user-id-1',
--   'user-id-2',
--   'user-id-3'
-- );

-- Check current founding sellers
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
        WHEN founding_seller_start_date > NOW() - INTERVAL '6 months' THEN 'Active (within 6 months)'
        ELSE 'Expired (6 months passed)'
      END
    ELSE 'Not a founding seller'
  END as founding_status
FROM public.profiles
WHERE is_seller = TRUE
ORDER BY created_at DESC;

