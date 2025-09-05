-- Remove duplicate policies then reapply RBAC correctly
DROP POLICY IF EXISTS "Only admins/support can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only admins/support can update contacts" ON public.contacts;

-- Restore the correct restricted policies
CREATE POLICY "Only admins/support can view contacts" ON public.contacts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

CREATE POLICY "Only admins/support can update contacts" ON public.contacts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));