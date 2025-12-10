-- =============================================
-- GET FUNCTION DEFINITIONS FOR discover_listings and search_listings
-- Run this first to see what needs to be fixed
-- =============================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN ('discover_listings', 'search_listings')
ORDER BY p.proname;

