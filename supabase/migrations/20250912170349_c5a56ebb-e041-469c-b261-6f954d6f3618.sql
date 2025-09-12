-- Security Enhancement: Strengthen RLS policies for profiles table
-- Drop existing policies to rebuild with more secure structure
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (restricted)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create comprehensive and secure RLS policies for profiles table

-- 1. SELECT policies - Users can only see their own profile, admins can see all
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. INSERT policies - Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. UPDATE policies - Users can update their own profile (except role), admins can update any profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. DELETE policies - Users can delete their own profile, admins can delete any profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Additional security: Ensure the validation trigger is in place for profile updates
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can modify roles
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
    
    -- Prevent users from modifying other users' profiles
    IF OLD.user_id != NEW.user_id THEN
      RAISE EXCEPTION 'Cannot change profile ownership';
    END IF;
    
    -- Ensure the user can only update their own profile (unless admin)
    IF NOT has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != NEW.user_id THEN
      RAISE EXCEPTION 'Access denied: can only update own profile';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS validate_profile_update ON public.profiles;
CREATE TRIGGER validate_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- Add audit logging for profile access (optional but recommended)
CREATE TABLE IF NOT EXISTS public.profile_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  accessed_profile_id uuid,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.profile_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access audit" 
ON public.profile_access_audit 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert profile access audit" 
ON public.profile_access_audit 
FOR INSERT 
WITH CHECK (true);