-- Add seller_info column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_info TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.seller_info IS 'Optional seller story/about section (max 500 characters) displayed on product detail pages';

