-- =============================================
-- SHOW FUNCTION DEFINITIONS - EASY TO COPY
-- Run this and copy the full_definition text
-- =============================================

-- Option 1: Show as single text (easier to copy)
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  length(pg_get_functiondef(p.oid)) as definition_length,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN ('discover_listings', 'search_listings')
ORDER BY p.proname;

-- Option 2: Show line by line (if Option 1 is still truncated)
-- Uncomment and run separately for each function:

-- For discover_listings:
/*
SELECT 
  row_number() OVER (ORDER BY 1) as line_num,
  line_text
FROM (
  SELECT unnest(string_to_array(pg_get_functiondef(p.oid), E'\n')) as line_text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'discover_listings'
) t;
*/

-- For search_listings:
/*
SELECT 
  row_number() OVER (ORDER BY 1) as line_num,
  line_text
FROM (
  SELECT unnest(string_to_array(pg_get_functiondef(p.oid), E'\n')) as line_text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'search_listings'
) t;
*/

