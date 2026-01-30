-- Add read_at column to messages table for seller inbox "mark as read"
-- Run in Supabase SQL Editor if messages table already exists.

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN public.messages.read_at IS 'When the seller viewed this message in their inbox';
