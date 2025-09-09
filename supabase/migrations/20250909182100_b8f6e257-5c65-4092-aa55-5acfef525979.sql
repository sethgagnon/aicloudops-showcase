-- Add scheduled_at column to polls table for scheduling functionality
ALTER TABLE public.polls 
ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;