-- Fix constraint issue and complete RBAC for contacts

-- Only add constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_role_unique' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);
  END IF;
END $$;

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Complete the RBAC setup for contacts
-- Tighten contacts RLS to admins/support only for read/update
DROP POLICY IF EXISTS "Only authenticated users can view contacts" ON public.contacts;
CREATE POLICY "Only admins/support can view contacts" ON public.contacts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

DROP POLICY IF EXISTS "Only authenticated users can update contacts" ON public.contacts;
CREATE POLICY "Only admins/support can update contacts" ON public.contacts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Seed: grant admin role to site owner based on profile email (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.email = 'sethgagnon@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'admin'
  );