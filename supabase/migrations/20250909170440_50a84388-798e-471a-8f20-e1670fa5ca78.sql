-- Add LinkedIn-specific fields to polls table
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS linkedin_post_id text,
ADD COLUMN IF NOT EXISTS linkedin_posted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS linkedin_content text;