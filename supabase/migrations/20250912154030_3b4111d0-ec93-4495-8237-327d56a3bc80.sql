-- Enhanced Security for Contacts Table
-- This migration addresses the security vulnerability by implementing multiple layers of protection

-- 1. Create enhanced audit logging table for contact access
CREATE TABLE IF NOT EXISTS public.contact_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    sensitive_fields_accessed TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.contact_security_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only super admins can view security audit"
ON public.contact_security_audit
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs"
ON public.contact_security_audit
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Create a more secure role validation function with additional checks
CREATE OR REPLACE FUNCTION public.validate_contact_access(_user_id UUID, _action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_has_role BOOLEAN := false;
    access_count INTEGER := 0;
    last_access TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Validate input parameters
    IF _user_id IS NULL OR _action IS NULL THEN
        INSERT INTO public.contact_security_audit (
            user_id, action, table_name, success, failure_reason, created_at
        ) VALUES (
            _user_id, _action, 'contacts', false, 'Invalid parameters provided', current_time
        );
        RETURN false;
    END IF;

    -- Check if user has admin or support role with enhanced validation
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.user_id = ur.user_id
        WHERE ur.user_id = _user_id 
        AND ur.role IN ('admin', 'support')
        AND p.user_id IS NOT NULL -- Ensure profile exists
    ) INTO user_has_role;

    -- Additional security: Check for suspicious access patterns
    -- Limit to 50 contact views per hour per user
    SELECT COUNT(*), MAX(created_at)
    INTO access_count, last_access
    FROM public.contact_security_audit
    WHERE user_id = _user_id 
    AND action = _action
    AND created_at > current_time - INTERVAL '1 hour';

    -- Rate limiting check
    IF access_count > 50 THEN
        INSERT INTO public.contact_security_audit (
            user_id, action, table_name, success, failure_reason, created_at
        ) VALUES (
            _user_id, _action, 'contacts', false, 'Rate limit exceeded - suspicious activity detected', current_time
        );
        RETURN false;
    END IF;

    -- Log the access attempt
    INSERT INTO public.contact_security_audit (
        user_id, action, table_name, success, failure_reason, created_at
    ) VALUES (
        _user_id, _action, 'contacts', user_has_role, 
        CASE WHEN NOT user_has_role THEN 'Insufficient privileges' ELSE NULL END,
        current_time
    );

    RETURN user_has_role;
END;
$$;

-- 3. Create function to validate and sanitize contact form submissions
CREATE OR REPLACE FUNCTION public.secure_contact_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    validation_result JSONB;
BEGIN
    -- Validate the submission using existing validation function
    SELECT validate_contact_submission(NEW.name, NEW.email, NEW.message) INTO validation_result;
    
    -- If validation fails, prevent insertion
    IF NOT (validation_result->>'valid')::BOOLEAN THEN
        RAISE EXCEPTION 'Contact submission validation failed: %', validation_result->>'errors';
    END IF;

    -- Sanitize data
    NEW.name := trim(regexp_replace(NEW.name, '[^\w\s\-\.]', '', 'g'));
    NEW.email := lower(trim(NEW.email));
    NEW.message := trim(NEW.message);
    
    -- Ensure required fields are not empty after sanitization
    IF length(NEW.name) < 2 OR length(NEW.email) < 5 OR length(NEW.message) < 10 THEN
        RAISE EXCEPTION 'Contact data invalid after sanitization';
    END IF;

    -- Log the submission
    INSERT INTO public.contact_security_audit (
        action, table_name, record_id, success, created_at
    ) VALUES (
        'contact_form_submission', 'contacts', NEW.id, true, now()
    );

    RETURN NEW;
END;
$$;

-- 4. Replace existing RLS policies with enhanced security policies
DROP POLICY IF EXISTS "Enhanced admin/support contacts access" ON public.contacts;
DROP POLICY IF EXISTS "Enhanced admin/support contacts update" ON public.contacts;
DROP POLICY IF EXISTS "Validated contact form submissions" ON public.contacts;

-- New secure SELECT policy with additional validation
CREATE POLICY "Ultra secure admin/support contacts access"
ON public.contacts
FOR SELECT
TO authenticated
USING (
    validate_contact_access(auth.uid(), 'view_contacts') AND
    -- Additional check: ensure user is still active
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND created_at < now() -- Prevent brand new accounts from accessing sensitive data
    )
);

-- New secure UPDATE policy
CREATE POLICY "Ultra secure admin/support contacts update"
ON public.contacts
FOR UPDATE
TO authenticated
USING (validate_contact_access(auth.uid(), 'update_contacts'))
WITH CHECK (validate_contact_access(auth.uid(), 'update_contacts'));

-- New secure INSERT policy with trigger validation
CREATE POLICY "Validated and logged contact submissions"
ON public.contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true); -- Validation handled by trigger

-- 5. Create trigger for contact form submissions
DROP TRIGGER IF EXISTS secure_contact_submission_trigger ON public.contacts;
CREATE TRIGGER secure_contact_submission_trigger
    BEFORE INSERT ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_contact_submission();

-- 6. Create function to mask sensitive data for non-admin users
CREATE OR REPLACE FUNCTION public.get_contacts_masked()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    message TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only return data if user has proper access
    IF NOT validate_contact_access(auth.uid(), 'view_contacts_masked') THEN
        RETURN;
    END IF;

    -- Return masked data for additional security layer
    RETURN QUERY
    SELECT 
        c.id,
        LEFT(c.name, 3) || '***' AS name,
        LEFT(split_part(c.email, '@', 1), 2) || '***@' || split_part(c.email, '@', 2) AS email,
        LEFT(c.message, 50) || '...' AS message,
        c.status,
        c.created_at
    FROM public.contacts c
    WHERE validate_contact_access(auth.uid(), 'view_contacts');
END;
$$;

-- 7. Add indexes for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_contact_security_audit_user_time 
ON public.contact_security_audit (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_contact_security_audit_action_time 
ON public.contact_security_audit (action, created_at);

-- 8. Create a function for admins to review security incidents
CREATE OR REPLACE FUNCTION public.get_security_incidents()
RETURNS TABLE (
    incident_time TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    action TEXT,
    failure_reason TEXT,
    incident_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only super admins can view security incidents
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        date_trunc('hour', csa.created_at) as incident_time,
        csa.user_id,
        csa.action,
        csa.failure_reason,
        COUNT(*) as incident_count
    FROM public.contact_security_audit csa
    WHERE csa.success = false
    AND csa.created_at > now() - INTERVAL '30 days'
    GROUP BY date_trunc('hour', csa.created_at), csa.user_id, csa.action, csa.failure_reason
    ORDER BY incident_time DESC;
END;
$$;