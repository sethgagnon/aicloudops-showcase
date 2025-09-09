-- Restrict SELECT on poll_votes to admins only to protect voter_ip
-- Drop public/authenticated SELECT policies
DROP POLICY IF EXISTS "Anyone can view votes for live polls" ON public.poll_votes;
DROP POLICY IF EXISTS "Authenticated users can view votes for closed polls" ON public.poll_votes;

-- Note: Admins retain access via existing "Admins can manage all votes" (ALL) policy.
-- No changes to INSERT policy (voting) to avoid breaking functionality.
