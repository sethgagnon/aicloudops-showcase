-- Fix contacts RLS ensuring only admins/support can read/update

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Only admins/support can view contacts" ON public.contacts;
CREATE POLICY "Only admins/support can view contacts" ON public.contacts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Only admins/support can update contacts" ON public.contacts;
CREATE POLICY "Only admins/support can update contacts" ON public.contacts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Seed admin role for site owner (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.email = 'sethgagnon@gmail.com'
ON CONFLICT DO NOTHING;