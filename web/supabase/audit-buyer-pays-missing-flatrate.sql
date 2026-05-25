-- Audit: buyer_pays shipping without a flat rate (read-only — does not modify data)
-- Run in Supabase SQL editor. shipping_info / custom_shipping_policy store JSON text.

-- ---------------------------------------------------------------------------
-- Affected listings
-- custom_shipping_policy.primary = 'buyer_pays' AND flatRate is null/missing
-- ---------------------------------------------------------------------------
SELECT
  l.id,
  l.title,
  l.status,
  l.seller_id,
  l.custom_shipping_policy,
  l.created_at,
  l.updated_at
FROM listings l
WHERE l.custom_shipping_policy IS NOT NULL
  AND l.custom_shipping_policy::jsonb ->> 'primary' = 'buyer_pays'
  AND (
    l.custom_shipping_policy::jsonb -> 'flatRate' IS NULL
    OR l.custom_shipping_policy::jsonb ->> 'flatRate' IS NULL
    OR TRIM(l.custom_shipping_policy::jsonb ->> 'flatRate') = ''
  )
ORDER BY l.updated_at DESC NULLS LAST;

-- Count only
SELECT COUNT(*) AS affected_listings
FROM listings l
WHERE l.custom_shipping_policy IS NOT NULL
  AND l.custom_shipping_policy::jsonb ->> 'primary' = 'buyer_pays'
  AND (
    l.custom_shipping_policy::jsonb -> 'flatRate' IS NULL
    OR l.custom_shipping_policy::jsonb ->> 'flatRate' IS NULL
    OR TRIM(l.custom_shipping_policy::jsonb ->> 'flatRate') = ''
  );

-- ---------------------------------------------------------------------------
-- Affected seller profiles (default shipping)
-- shipping_info.primary = 'buyer_pays' AND flatRate is null/missing
-- ---------------------------------------------------------------------------
SELECT
  p.user_id,
  p.display_name,
  p.email,
  p.shipping_info,
  p.is_seller
FROM profiles p
WHERE p.shipping_info IS NOT NULL
  AND p.shipping_info::jsonb ->> 'primary' = 'buyer_pays'
  AND (
    p.shipping_info::jsonb -> 'flatRate' IS NULL
    OR p.shipping_info::jsonb ->> 'flatRate' IS NULL
    OR TRIM(p.shipping_info::jsonb ->> 'flatRate') = ''
  )
ORDER BY p.display_name NULLS LAST;

-- Count only
SELECT COUNT(*) AS affected_seller_profiles
FROM profiles p
WHERE p.shipping_info IS NOT NULL
  AND p.shipping_info::jsonb ->> 'primary' = 'buyer_pays'
  AND (
    p.shipping_info::jsonb -> 'flatRate' IS NULL
    OR p.shipping_info::jsonb ->> 'flatRate' IS NULL
    OR TRIM(p.shipping_info::jsonb ->> 'flatRate') = ''
  );

-- ---------------------------------------------------------------------------
-- Listings that would block checkout (listing override OR seller default)
-- Uses same resolution as app: listing custom_shipping_policy → profiles.shipping_info → free
-- ---------------------------------------------------------------------------
SELECT
  l.id,
  l.title,
  l.status,
  l.seller_id,
  l.custom_shipping_policy AS listing_policy,
  p.shipping_info AS seller_default_policy
FROM listings l
LEFT JOIN profiles p ON p.user_id = l.seller_id
WHERE COALESCE(
    CASE
      WHEN l.custom_shipping_policy IS NOT NULL
        AND l.custom_shipping_policy::jsonb ? 'primary'
      THEN l.custom_shipping_policy::jsonb ->> 'primary'
      WHEN p.shipping_info IS NOT NULL
        AND p.shipping_info::jsonb ? 'primary'
      THEN p.shipping_info::jsonb ->> 'primary'
      ELSE 'free'
    END,
    'free'
  ) = 'buyer_pays'
  AND COALESCE(
    CASE
      WHEN l.custom_shipping_policy IS NOT NULL
        AND l.custom_shipping_policy::jsonb ? 'primary'
      THEN l.custom_shipping_policy::jsonb -> 'flatRate'
      WHEN p.shipping_info IS NOT NULL
        AND p.shipping_info::jsonb ? 'primary'
      THEN p.shipping_info::jsonb -> 'flatRate'
      ELSE NULL
    END,
    NULL
  ) IS NULL
ORDER BY l.status, l.updated_at DESC NULLS LAST;
