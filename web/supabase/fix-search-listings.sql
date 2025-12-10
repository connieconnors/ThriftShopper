-- =============================================
-- FIX search_listings FUNCTION
-- Adds SET search_path = public for security
-- =============================================

DROP FUNCTION IF EXISTS public.search_listings(vector, double precision, integer) CASCADE;

CREATE OR REPLACE FUNCTION public.search_listings(
  query_embedding vector, 
  match_threshold double precision, 
  match_count integer
)
RETURNS TABLE(
  id uuid, 
  seller_id uuid, 
  title text, 
  description text, 
  price numeric, 
  category text, 
  original_image_url text, 
  clean_image_url text, 
  staged_image_url text, 
  status text, 
  styles text[], 
  moods text[], 
  intents text[], 
  embedding vector, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$

BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.seller_id,
    l.title,
    l.description,
    l.price,
    l.category,
    l.original_image_url,
    l.clean_image_url,
    l.staged_image_url,
    l.status,
    COALESCE(l.styles, ARRAY[]::text[]) as styles,
    COALESCE(l.moods, ARRAY[]::text[]) as moods,
    COALESCE(l.intents, ARRAY[]::text[]) as intents,
    l.embedding,
    l.created_at,
    l.updated_at,
    1 - (l.embedding <=> query_embedding) as similarity
  FROM public.listings l
  WHERE l.status = 'active'
    AND l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;

$function$;

