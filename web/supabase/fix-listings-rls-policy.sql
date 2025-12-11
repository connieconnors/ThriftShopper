-- =============================================
-- FIX LISTINGS RLS POLICY FOR INSERT
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;

-- Create new INSERT policy that allows sellers to create listings
-- seller_id should match auth.uid() (the user's auth ID)
CREATE POLICY "Sellers can create listings" 
  ON public.listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'listings' AND policyname = 'Sellers can create listings';

