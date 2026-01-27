-- =============================================
-- BETA_ACCESS CHECK FUNCTION (Alternative approach)
-- Creates an RPC function that can bypass RLS
-- Use this if direct table queries are blocked
-- =============================================

-- Create function to check beta access
-- This function runs with SECURITY DEFINER, so it can bypass RLS
CREATE OR REPLACE FUNCTION public.check_beta_access(check_email TEXT)
RETURNS TABLE(email TEXT, status TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.email::TEXT,
    ba.status::TEXT
  FROM public.beta_access ba
  WHERE LOWER(TRIM(ba.email)) = LOWER(TRIM(check_email))
    AND ba.status = 'invited'
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.check_beta_access(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_beta_access(TEXT) TO authenticated;

-- =============================================
-- USAGE
-- =============================================
-- In your code, call it like:
-- const { data, error } = await supabase.rpc('check_beta_access', { check_email: email.toLowerCase().trim() });
