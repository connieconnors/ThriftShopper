-- =============================================
-- QUICK FIX: RLS Policy + Profile Check
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Fix RLS policy for listings INSERT
DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;

CREATE POLICY "Sellers can create listings" 
  ON public.listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- 2. Make sure profiles table allows inserts/updates
-- (This should already exist, but just in case)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = id);

-- 3. Check if your profile exists and create/update it if needed
-- Replace 'YOUR_USER_ID_HERE' with your actual auth.users.id
-- You can find this in Supabase Dashboard → Authentication → Users

-- First, let's see what profiles exist:
SELECT id, user_id, email, display_name, is_seller 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- If you need to manually create/update your profile:
-- UPDATE public.profiles 
-- SET is_seller = true 
-- WHERE user_id = 'YOUR_USER_ID_HERE' OR id = 'YOUR_USER_ID_HERE';

