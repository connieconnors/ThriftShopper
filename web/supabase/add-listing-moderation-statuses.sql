-- Listing moderation statuses: rejected, pending_review
-- Run in Supabase SQL Editor after add-moderation-reports-blocks.sql
--
-- listings.status is TEXT (no enum). These values are used at publish time:
--   active          — visible in marketplace feed
--   rejected        — failed automated content review; not visible
--   pending_review  — moderation API unavailable; held until manual review; not visible
--   draft           — seller working copy; not visible

COMMENT ON COLUMN public.listings.status IS
  'Listing lifecycle: draft, pending_review, rejected, active, sold, hidden';
