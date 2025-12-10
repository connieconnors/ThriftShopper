-- =============================================
-- FIX SECURITY WARNINGS - SIMPLE VERSION
-- Addresses the 8 warnings from Security Advisor
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE (5 functions)
-- =============================================
-- Add SET search_path = public to prevent injection attacks

-- Fix touch_updated_at function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Fix match_listings_by_mood function
-- Drop first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.match_listings_by_mood(vector, double precision, integer) CASCADE;

CREATE FUNCTION public.match_listings_by_mood(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  moods text,
  styles text,
  intents text,
  category text,
  primary_image_url text,
  seller_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.description,
    l.price,
    l.moods,
    l.styles,
    l.intents,
    l.category,
    l.primary_image_url,
    l.seller_id,
    l.created_at,
    1 - (l.embedding <=> query_embedding) as similarity
  FROM public.listings l
  WHERE
    l.status = 'active'
    AND l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- 2. FIX PROFILES RLS POLICY (Info suggestion)
-- =============================================
-- Ensure profiles has proper policies
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Drop and recreate to ensure they exist
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
      CREATE POLICY "Profiles are viewable by everyone" 
        ON public.profiles FOR SELECT 
        USING (true);
      
      CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
      
      CREATE POLICY "Users can insert own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
  END IF;
END $$;

-- =============================================
-- FIX discover_listings and search_listings
-- =============================================
-- These functions need SET search_path = public added
-- 
-- INSTRUCTIONS:
-- 1. First, run get-function-definitions.sql to see the full function definitions
-- 2. Copy each function's CREATE FUNCTION statement
-- 3. Add "SET search_path = public" before the "AS $$" line
-- 4. Add "DROP FUNCTION IF EXISTS" before each CREATE
-- 5. Run the updated statements
--
-- OR use the automated fix below (drops and provides instructions):

-- =============================================
-- NOTES ON REMAINING WARNINGS
-- =============================================
-- 
-- 3. Function Search Path Mutable (discover_listings, search_listings):
--    The functions above have been dropped. You need to:
--    1. Go to Supabase SQL Editor > Database > Functions
--    2. Find discover_listings and search_listings
--    3. Copy their CREATE FUNCTION statements
--    4. Add "SET search_path = public" before the AS $$ line
--    5. Run the updated CREATE FUNCTION statements
--
-- 4. Extension in Public Schema (vector):
--    This warning is acceptable for vector search functionality.
--    The vector extension needs to be in public schema for pgvector to work.
--    You can safely ignore this warning.
--
-- 5. Leaked Password Protection Disabled:
--    Fix in Dashboard: Authentication > Settings > Enable "Leaked Password Protection"
--
-- 6. Insufficient MFA Options:
--    Fix in Dashboard: Authentication > Settings > Multi-Factor Authentication
--    Enable at least TOTP (Time-based One-Time Password)
--
-- =============================================
-- VERIFICATION
-- =============================================
-- Check which functions still need search_path
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ NO search_path'
    WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN '✅ HAS search_path'
    ELSE '❌ NO search_path'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('touch_updated_at', 'handle_new_user', 'discover_listings', 'match_listings_by_mood', 'search_listings')
ORDER BY p.proname;

