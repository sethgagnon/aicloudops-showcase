-- RBAC for contacts: restrict access to admins/support while preserving public submissions

-- 1) Create roles enum (idempotent)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','support','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Create user_roles table (idempotent)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Security-definer helper to check roles (with fixed search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4) RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Tighten contacts RLS to admins/support only for read/update
DROP POLICY IF EXISTS "Only authenticated users can view contacts" ON public.contacts;
CREATE POLICY "Only admins/support can view contacts" ON public.contacts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

DROP POLICY IF EXISTS "Only authenticated users can update contacts" ON public.contacts;
CREATE POLICY "Only admins/support can update contacts" ON public.contacts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Keep existing INSERT policy to allow public submissions

-- 6) Seed: grant admin role to site owner based on profile email
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.email = 'sethgagnon@gmail.com'
ON CONFLICT DO NOTHING;