-- =============================================
-- FIX PROFILES RLS POLICY FOR user_id COLUMN
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies using user_id (the actual column name in your database)
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

