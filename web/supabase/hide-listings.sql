-- =============================================
-- HIDE/DELETE LISTINGS
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Change status to 'hidden' (keeps data, hides from browse)
-- Replace 'LISTING_ID_1', 'LISTING_ID_2' with actual listing IDs
UPDATE public.listings
SET status = 'hidden', updated_at = NOW()
WHERE id IN ('LISTING_ID_1', 'LISTING_ID_2');

-- Option 2: Change status to 'sold' (if they were sold)
UPDATE public.listings
SET status = 'sold', updated_at = NOW()
WHERE id IN ('LISTING_ID_1', 'LISTING_ID_2');

-- Option 3: Delete completely (permanent - be careful!)
-- DELETE FROM public.listings WHERE id IN ('LISTING_ID_1', 'LISTING_ID_2');

-- Option 4: Hide all listings by a specific seller
-- Replace 'SELLER_USER_ID' with the seller's user_id
UPDATE public.listings
SET status = 'hidden', updated_at = NOW()
WHERE seller_id = 'SELLER_USER_ID';

-- Option 5: Hide listings by title (if you remember part of the title)
UPDATE public.listings
SET status = 'hidden', updated_at = NOW()
WHERE title ILIKE '%part of title%';

