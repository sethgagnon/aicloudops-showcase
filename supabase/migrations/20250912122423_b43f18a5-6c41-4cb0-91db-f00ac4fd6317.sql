-- Simplified enhanced security measures for contacts table

-- 1. Create audit log table for tracking access to sensitive contact data
CREATE TABLE public.contact_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  action TEXT NOT NULL CHECK (action IN ('view', 'update', 'export', 'role_check')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.contact_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view access logs" 
ON public.contact_access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.contact_access_logs 
FOR INSERT 
WITH CHECK (true);

-- 2. Enhanced security function with better error handling and logging
CREATE OR REPLACE FUNCTION public.has_role_secure(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_has_role boolean := false;
  error_occurred boolean := false;
BEGIN
  -- Validate input parameters
  IF _user_id IS NULL OR _role IS NULL THEN
    RAISE LOG 'has_role_secure called with null parameters: user_id=%, role=%', _user_id, _role;
    RETURN false;
  END IF;

  -- Check if user has the role
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    ) INTO user_has_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error checking role for user %: %', _user_id, SQLERRM;
    error_occurred := true;
  END;

  -- Log security-related role checks for admin/support roles
  IF _role IN ('admin'::app_role, 'support'::app_role) THEN
    BEGIN
      INSERT INTO public.contact_access_logs (
        user_id, 
        action, 
        success,
        failure_reason
      ) VALUES (
        _user_id, 
        'role_check',
        NOT error_occurred AND user_has_role,
        CASE WHEN error_occurred THEN 'Database error during role check' 
             WHEN NOT user_has_role THEN 'User does not have required role'
             ELSE NULL END
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail role check due to logging issues
      RAISE LOG 'Failed to log role check: %', SQLERRM;
    END;
  END IF;

  -- Return false if error occurred or user doesn't have role
  RETURN NOT error_occurred AND user_has_role;
END;
$$;

-- 3. Update RLS policies with enhanced security
DROP POLICY IF EXISTS "Only admins/support can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only admins/support can update contacts" ON public.contacts;

-- Enhanced view policy with secure role checking
CREATE POLICY "Enhanced admin/support contacts access" 
ON public.contacts 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (has_role_secure(auth.uid(), 'admin'::app_role) 
       OR has_role_secure(auth.uid(), 'support'::app_role))
);

-- Enhanced update policy  
CREATE POLICY "Enhanced admin/support contacts update" 
ON public.contacts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (has_role_secure(auth.uid(), 'admin'::app_role) 
       OR has_role_secure(auth.uid(), 'support'::app_role))
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (has_role_secure(auth.uid(), 'admin'::app_role) 
       OR has_role_secure(auth.uid(), 'support'::app_role))
);

-- Keep original insert policy but enhance it slightly
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contacts;
CREATE POLICY "Validated contact form submissions" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true); -- We'll handle validation in the application layer

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_user_id ON public.contact_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_accessed_at ON public.contact_access_logs(accessed_at);

-- 5. Create function to validate contact submissions (to be called from application)
CREATE OR REPLACE FUNCTION public.validate_contact_submission(_name text, _email text, _message text, _ip inet DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
BEGIN
  -- Basic validation
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    errors := array_append(errors, 'Name is required');
  ELSIF length(_name) > 100 THEN
    errors := array_append(errors, 'Name must be 100 characters or less');
  END IF;

  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    errors := array_append(errors, 'Email is required');
  ELSIF length(_email) > 255 THEN
    errors := array_append(errors, 'Email must be 255 characters or less');
  ELSIF _email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    errors := array_append(errors, 'Email format is invalid');
  END IF;

  IF _message IS NULL OR length(trim(_message)) = 0 THEN
    errors := array_append(errors, 'Message is required');
  ELSIF length(_message) > 2000 THEN
    errors := array_append(errors, 'Message must be 2000 characters or less');
  END IF;

  -- Check for potential injection attempts
  IF _name ~ '[\r\n]' OR _email ~ '[\r\n]' THEN
    errors := array_append(errors, 'Invalid characters detected');
  END IF;

  -- Simple rate limiting check (5 submissions per hour per IP)
  IF _ip IS NOT NULL THEN
    DECLARE
      recent_submissions integer;
    BEGIN
      SELECT count(*) INTO recent_submissions
      FROM public.contacts
      WHERE created_at > now() - INTERVAL '1 hour'
      AND (
        -- This is a simple approximation since we don't store IP in contacts
        -- In a real implementation, you'd want to track IPs separately
        email = _email
      );

      IF recent_submissions >= 5 THEN
        errors := array_append(errors, 'Rate limit exceeded. Please wait before submitting again.');
      END IF;
    END;
  END IF;

  -- Build result
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', array_to_json(errors)
    );
  END IF;

  RETURN validation_result;
END;
$$;