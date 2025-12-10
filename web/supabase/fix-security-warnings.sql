-- =============================================
-- FIX SECURITY WARNINGS
-- Addresses the 8 warnings from Security Advisor
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE (5 functions)
-- =============================================
-- Functions need SET search_path for security to prevent injection attacks

-- Fix touch_updated_at function
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'touch_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    DROP FUNCTION IF EXISTS public.touch_updated_at CASCADE;
  END IF;
END $$;

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
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
  END IF;
END $$;

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

-- Fix match_listings_by_mood function (add search_path)
CREATE OR REPLACE FUNCTION public.match_listings_by_mood(
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

-- Fix discover_listings function (if it exists - add search_path)
-- Note: You'll need to check the actual function signature in Supabase
-- This is a template - adjust parameters and body as needed
DO $$ 
DECLARE
  func_signature text;
BEGIN
  -- Get the function signature
  SELECT pg_get_function_identity_arguments(oid) INTO func_signature
  FROM pg_proc 
  WHERE proname = 'discover_listings' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LIMIT 1;
  
  IF func_signature IS NOT NULL THEN
    -- You'll need to manually update this function in Supabase SQL Editor
    -- Add: SET search_path = public
    -- to the function definition
    RAISE NOTICE 'Function discover_listings exists. Please manually add SET search_path = public to its definition.';
  END IF;
END $$;

-- Fix search_listings function (if it exists - add search_path)
DO $$ 
DECLARE
  func_signature text;
BEGIN
  SELECT pg_get_function_identity_arguments(oid) INTO func_signature
  FROM pg_proc 
  WHERE proname = 'search_listings' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LIMIT 1;
  
  IF func_signature IS NOT NULL THEN
    RAISE NOTICE 'Function search_listings exists. Please manually add SET search_path = public to its definition.';
  END IF;
END $$;

-- =============================================
-- 2. FIX EXTENSION IN PUBLIC SCHEMA
-- =============================================
-- Move vector extension to a separate schema (or accept the warning)
-- Note: This might break existing vector search functionality
-- Option 1: Accept the warning (recommended for now)
-- Option 2: Move extension (more complex, may require code changes)

-- For now, we'll document this - the warning is acceptable for vector search
-- If you want to fix it, you'd need to:
-- 1. Create a new schema: CREATE SCHEMA IF NOT EXISTS extensions;
-- 2. Move extension: ALTER EXTENSION vector SET SCHEMA extensions;
-- 3. Update search_path in functions that use it

-- =============================================
-- 3. FIX PROFILES RLS POLICY (Info suggestion)
-- =============================================
-- Make sure profiles has proper policies
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
-- NOTES ON AUTH WARNINGS (4 & 5)
-- =============================================
-- These need to be fixed in Supabase Dashboard > Authentication > Settings:
-- 
-- 3. Leaked Password Protection:
--    - Go to Authentication > Settings
--    - Enable "Leaked Password Protection"
--    - This checks passwords against known breach databases
--
-- 4. Insufficient MFA Options:
--    - Go to Authentication > Settings > Multi-Factor Authentication
--    - Enable at least 2 MFA methods (e.g., TOTP and SMS)
--    - For beta, you might want to enable TOTP at minimum
--
-- These can't be fixed via SQL - they're dashboard settings

-- =============================================
-- VERIFICATION
-- =============================================
-- Check functions have search_path set
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN 'NO search_path'
    WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN 'HAS search_path'
    ELSE 'NO search_path'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('touch_updated_at', 'handle_new_user', 'discover_listings', 'match_listings_by_mood', 'search_listings')
ORDER BY p.proname;

