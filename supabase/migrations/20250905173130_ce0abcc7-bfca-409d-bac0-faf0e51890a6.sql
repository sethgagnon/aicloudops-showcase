-- Restrict public access to email in profiles by tightening SELECT RLS
-- 1) Drop overly-permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2) Allow users to view ONLY their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);
