-- Allow 'scheduled' as a valid status for polls
ALTER TABLE public.polls DROP CONSTRAINT IF EXISTS polls_status_check;
ALTER TABLE public.polls
  ADD CONSTRAINT polls_status_check CHECK (status IN ('draft','scheduled','live','closed'));
