-- FIX handle_new_user TRIGGER FOR user_id COLUMN
-- The profiles table uses user_id, not id, so the trigger needs to be updated

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function using user_id instead of id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,  -- auth.users.id goes into profiles.user_id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

