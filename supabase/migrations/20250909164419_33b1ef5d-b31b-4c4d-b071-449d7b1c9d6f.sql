-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  total_votes INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  week_of DATE NOT NULL DEFAULT CURRENT_DATE,
  linkedin_post_id TEXT,
  linkedin_posted_at TIMESTAMP WITH TIME ZONE,
  linkedin_content TEXT
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  option_index INTEGER NOT NULL,
  voter_ip INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_vote UNIQUE (poll_id, user_id),
  CONSTRAINT unique_ip_vote UNIQUE (poll_id, voter_ip) DEFERRABLE INITIALLY DEFERRED
);

-- Enable Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone can view live polls"
ON public.polls
FOR SELECT
USING (status = 'live');

CREATE POLICY "Authenticated users can view closed polls"
ON public.polls
FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'closed');

CREATE POLICY "Admins can manage all polls"
ON public.polls
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for poll_votes
CREATE POLICY "Anyone can vote on live polls"
ON public.poll_votes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls 
    WHERE id = poll_id AND status = 'live'
  )
);

CREATE POLICY "Anyone can view votes for live polls"
ON public.poll_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.polls 
    WHERE id = poll_id AND status = 'live'
  )
);

CREATE POLICY "Authenticated users can view votes for closed polls"
ON public.poll_votes
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.polls 
    WHERE id = poll_id AND status = 'closed'
  )
);

CREATE POLICY "Admins can manage all votes"
ON public.poll_votes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating poll updated_at
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update poll vote count
CREATE OR REPLACE FUNCTION public.update_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.polls 
    SET total_votes = total_votes + 1 
    WHERE id = NEW.poll_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.polls 
    SET total_votes = total_votes - 1 
    WHERE id = OLD.poll_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update vote counts
CREATE TRIGGER update_poll_vote_count_trigger
AFTER INSERT OR DELETE ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_poll_vote_count();