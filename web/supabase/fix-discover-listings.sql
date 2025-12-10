-- =============================================
-- FIX discover_listings FUNCTION
-- Adds SET search_path = public for security
-- =============================================

DROP FUNCTION IF EXISTS public.discover_listings(text[], text[], text[]) CASCADE;

CREATE OR REPLACE FUNCTION public.discover_listings(
  p_moods text[] DEFAULT '{}'::text[], 
  p_intents text[] DEFAULT '{}'::text[], 
  p_styles text[] DEFAULT '{}'::text[]
)
RETURNS SETOF listings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$

  select *
  from public.listings l
  where
    l.status = 'active'
    -- moods filter (if any moods passed in)
    and (
      p_moods = '{}'::text[]
      or string_to_array(l.moods, ',') && p_moods
    )
    -- intents filter (if any intents passed in)
    and (
      p_intents = '{}'::text[]
      or string_to_array(l.intents, ',') && p_intents
    )
    -- styles filter (if any styles passed in)
    and (
      p_styles = '{}'::text[]
      or string_to_array(l.styles, ',') && p_styles
    )
  order by l.created_at desc;

$function$;

