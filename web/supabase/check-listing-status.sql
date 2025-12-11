-- =============================================
-- CHECK LISTING STATUSES
-- Run this in Supabase SQL Editor to see all listings and their statuses
-- =============================================

SELECT 
  id,
  title,
  status,
  seller_id,
  created_at,
  updated_at
FROM public.listings
ORDER BY created_at DESC;

-- To see only active listings (what shows in browse):
-- SELECT * FROM public.listings WHERE status = 'active';

-- To see listings that should be hidden:
-- SELECT * FROM public.listings WHERE status IN ('sold', 'hidden', 'draft');

