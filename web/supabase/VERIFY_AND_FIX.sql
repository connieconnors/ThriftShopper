-- =============================================
-- VERIFY PROFILE AND FIX RLS
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check your profile
SELECT id, user_id, email, display_name, is_seller, created_at
FROM public.profiles 
WHERE is_seller = true
ORDER BY created_at DESC;

-- 2. Fix RLS policy for listings (drop and recreate)
DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;

CREATE POLICY "Sellers can create listings" 
  ON public.listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- 3. Verify the policy was created
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'listings' AND policyname = 'Sellers can create listings';

-- 4. Check if RLS is enabled on listings
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'listings';

