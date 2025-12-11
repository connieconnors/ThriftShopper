-- CREATE MISSING PROFILE FOR EXISTING USER
-- Run this in Supabase SQL Editor if a user exists in auth.users but not in profiles

-- Replace 'USER_EMAIL_HERE' with the actual email of the user
-- Or replace 'USER_ID_HERE' with the actual UUID from auth.users

-- Option 1: Create profile by email
INSERT INTO public.profiles (user_id, email, display_name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  created_at
FROM auth.users
WHERE email = 'USER_EMAIL_HERE'  -- Replace with actual email
  AND id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Option 2: Create profile by user ID (if you know the UUID)
-- INSERT INTO public.profiles (user_id, email, display_name, created_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
--   created_at
-- FROM auth.users
-- WHERE id = 'USER_ID_HERE'::uuid  -- Replace with actual UUID
--   AND id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify the profile was created
SELECT 
  p.user_id,
  p.email,
  p.display_name,
  p.is_seller,
  u.email as auth_email,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';  -- Replace with actual email

