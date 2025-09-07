
-- Allow admins to select all profiles (read-only)
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (has_role(auth.uid(), 'admin'::app_role));
