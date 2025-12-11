-- =============================================
-- FIX LISTINGS TABLE - Add styles, moods, intents columns
-- Run this in Supabase SQL Editor
-- =============================================

-- Add columns if they don't exist
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS styles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS moods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS intents TEXT[] DEFAULT '{}';

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  udt_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name IN ('styles', 'moods', 'intents')
ORDER BY column_name;

-- Check existing data
SELECT id, title, styles, moods, intents
FROM public.listings
ORDER BY created_at DESC
LIMIT 5;

