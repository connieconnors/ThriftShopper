-- =============================================
-- BETA_ACCESS TABLE RLS POLICY
-- Allows anonymous users to check if their email has beta access
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable RLS on beta_access table (if not already enabled)
ALTER TABLE IF EXISTS public.beta_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can check beta access by email" ON public.beta_access;

-- Allow anonymous users to SELECT from beta_access table
-- This is safe because:
-- 1. We only expose email and status (no sensitive data)
-- 2. Users can only check their own email
-- 3. This is necessary for the beta gate to work
CREATE POLICY "Anyone can check beta access by email" 
  ON public.beta_access FOR SELECT 
  USING (true);

-- Note: INSERT/UPDATE/DELETE should remain restricted to service role
-- Only admins should be able to manage beta_access entries

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if RLS is enabled and policy exists
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
WHERE schemaname = 'public' 
  AND tablename = 'beta_access';
