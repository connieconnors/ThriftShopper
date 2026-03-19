-- =============================================
-- BETA_ACCESS: activated_at fix
-- Run this in Supabase SQL Editor
--
-- 1. activated_at should be NULL when you add an invite (so you can see
--    who actually activated and when). Remove any default so it stays NULL.
-- 2. "Activated" = they signed in at the beta gate (entered email, were
--    let in). We record that when they pass the gate, not when they
--    create an account. Use record_beta_activation() from the gate page.
-- =============================================

-- 1. Ensure activated_at has no default (stays NULL for new invites)
ALTER TABLE public.beta_access
  ALTER COLUMN activated_at DROP DEFAULT;

-- Optional: ensure column allows NULL (it usually does)
ALTER TABLE public.beta_access
  ALTER COLUMN activated_at DROP NOT NULL;

-- 1b. Force activated_at to NULL on every new row (even if UI or API sends a value)
DROP TRIGGER IF EXISTS beta_access_force_activated_at_null_on_insert ON public.beta_access;
CREATE OR REPLACE FUNCTION public.beta_access_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.activated_at := NULL;
  RETURN NEW;
END;
$$;
CREATE TRIGGER beta_access_force_activated_at_null_on_insert
  BEFORE INSERT ON public.beta_access
  FOR EACH ROW EXECUTE FUNCTION public.beta_access_before_insert();

-- Remove old trigger if you ran the previous version (activation = at gate, not at signup)
DROP TRIGGER IF EXISTS on_auth_user_created_mark_beta_activated ON auth.users;
DROP FUNCTION IF EXISTS public.mark_beta_activated_on_signup();

-- 2. RPC: record that this email just passed the beta gate (activated).
--    Call this from the gate page after we've confirmed they're invited.
--    Only updates if status = 'invited' and activated_at IS NULL (idempotent).
CREATE OR REPLACE FUNCTION public.record_beta_activation(check_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.beta_access
  SET activated_at = now()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(check_email))
    AND status = 'invited'
    AND activated_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_beta_activation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_beta_activation(TEXT) TO authenticated;

-- Done. New invites get activated_at = NULL. When someone enters their
-- email at the beta gate and is let in, the app calls record_beta_activation(email)
-- so you can see who actually used their invite and when.
