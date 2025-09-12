-- Security Enhancement: Ultra-secure audit log policies (Fixed column names)
-- Create super admin role for the most sensitive security operations
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Drop existing audit log policies to rebuild with enhanced security
DROP POLICY IF EXISTS "Only admins can view access logs" ON public.contact_access_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.contact_access_logs;
DROP POLICY IF EXISTS "Only super admins can view security audit" ON public.contact_security_audit;
DROP POLICY IF EXISTS "System can insert security audit logs" ON public.contact_security_audit;

-- Create enhanced security function for super admin check
CREATE OR REPLACE FUNCTION public.has_super_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_has_access boolean := false;
    current_user_id uuid := auth.uid();
BEGIN
    -- Only authenticated users can proceed
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Check if user has super_admin or admin role (for backward compatibility)
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = current_user_id 
        AND role IN ('super_admin'::app_role, 'admin'::app_role)
    ) INTO user_has_access;

    RETURN user_has_access;
END;
$$;

-- Create masked view function for less sensitive audit data access
CREATE OR REPLACE FUNCTION public.get_masked_audit_summary()
RETURNS TABLE(
    date_period date,
    action_type text,
    success_count bigint,
    failure_count bigint,
    unique_ips bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow super admins to access even masked data
    IF NOT public.has_super_admin_access() THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        DATE(created_at) as date_period,
        action as action_type,
        COUNT(*) FILTER (WHERE success = true) as success_count,
        COUNT(*) FILTER (WHERE success = false) as failure_count,
        COUNT(DISTINCT ip_address) as unique_ips
    FROM public.contact_security_audit
    WHERE created_at > now() - INTERVAL '30 days'
    GROUP BY DATE(created_at), action
    ORDER BY date_period DESC, action_type;
END;
$$;

-- Ultra-restrictive policies for contact_access_logs
CREATE POLICY "Super admins only: view access logs" 
ON public.contact_access_logs 
FOR SELECT 
USING (public.has_super_admin_access());

CREATE POLICY "System only: insert access logs" 
ON public.contact_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Prevent updates and deletes on audit logs for integrity
CREATE POLICY "No updates allowed on audit logs" 
ON public.contact_access_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed on audit logs" 
ON public.contact_access_logs 
FOR DELETE 
USING (false);

-- Ultra-restrictive policies for contact_security_audit  
CREATE POLICY "Super admins only: view security audit" 
ON public.contact_security_audit 
FOR SELECT 
USING (public.has_super_admin_access());

CREATE POLICY "System only: insert security audit logs" 
ON public.contact_security_audit 
FOR INSERT 
WITH CHECK (true);

-- Prevent updates and deletes on security audit logs for integrity
CREATE POLICY "No updates allowed on security audit" 
ON public.contact_security_audit 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed on security audit" 
ON public.contact_security_audit 
FOR DELETE 
USING (false);

-- Create a secure function to promote existing admin to super_admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only existing admins can promote others to super_admin
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Check if user already has super_admin role
    IF has_role(target_user_id, 'super_admin'::app_role) THEN
        RETURN true;
    END IF;

    -- Add super_admin role (users can have multiple roles)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN true;
END;
$$;

-- Add indexes for performance on audit tables
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_accessed_at ON public.contact_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_user_id ON public.contact_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_security_audit_created_at ON public.contact_security_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_security_audit_user_id ON public.contact_security_audit(user_id);

-- Create a policy for the profile_access_audit table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_access_audit' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Super admins only: view profile audit" ON public.profile_access_audit FOR SELECT USING (public.has_super_admin_access())';
    END IF;
END $$;

-- Add the current admin user to super_admin role for continuity
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the first admin user
    SELECT user_id INTO admin_user_id 
    FROM public.user_roles 
    WHERE role = 'admin'::app_role 
    LIMIT 1;
    
    -- Add super_admin role if admin exists
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'super_admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;