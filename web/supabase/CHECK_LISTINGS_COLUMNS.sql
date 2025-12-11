-- =============================================
-- CHECK LISTINGS TABLE COLUMNS
-- Run this in Supabase SQL Editor
-- =============================================

-- Check if styles, moods, intents columns exist
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name IN ('styles', 'moods', 'intents')
ORDER BY column_name;

-- If columns don't exist, create them:
-- ALTER TABLE public.listings 
-- ADD COLUMN IF NOT EXISTS styles TEXT[] DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS moods TEXT[] DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS intents TEXT[] DEFAULT '{}';

-- Check a sample listing to see what's stored
SELECT id, title, styles, moods, intents
FROM public.listings
ORDER BY created_at DESC
LIMIT 3;

