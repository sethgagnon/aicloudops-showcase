-- Enhanced security measures for contacts table (corrected version)

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

-- 2. Create rate limiting table for contact submissions
CREATE TABLE public.contact_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  email TEXT,
  submission_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- Anyone can check rate limit status (needed for the function to work)
CREATE POLICY "Public rate limit checks" 
ON public.contact_rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Enhanced security function with better error handling and logging
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

-- 4. Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(_ip inet, _email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rate_limit_exceeded boolean := false;
  current_count integer := 0;
  window_minutes integer := 60; -- 1 hour window
  max_submissions integer := 5; -- Max 5 submissions per hour
BEGIN
  -- Clean up old rate limit records (older than 24 hours)
  DELETE FROM public.contact_rate_limits 
  WHERE window_start < now() - INTERVAL '24 hours';

  -- Check current submission count in the time window
  SELECT COALESCE(SUM(submission_count), 0) INTO current_count
  FROM public.contact_rate_limits
  WHERE ip_address = _ip 
    AND window_start > now() - (window_minutes || ' minutes')::interval
    AND (_email IS NULL OR email = _email);

  -- Check if rate limit is exceeded
  IF current_count >= max_submissions THEN
    rate_limit_exceeded := true;
  ELSE
    -- Insert new rate limit record
    INSERT INTO public.contact_rate_limits (ip_address, email, submission_count, window_start)
    VALUES (_ip, _email, 1, now());
  END IF;

  RETURN NOT rate_limit_exceeded;
END;
$$;

-- 5. Update RLS policies with enhanced security
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

-- Enhanced insert policy with rate limiting
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contacts;
CREATE POLICY "Rate-limited contact form submissions" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  -- Basic validation and rate limiting
  NEW.name IS NOT NULL 
  AND NEW.email IS NOT NULL 
  AND NEW.message IS NOT NULL
  AND length(NEW.name) <= 100
  AND length(NEW.email) <= 255
  AND length(NEW.message) <= 2000
  AND check_contact_rate_limit(inet_client_addr(), NEW.email) = true
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_user_id ON public.contact_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_access_logs_accessed_at ON public.contact_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip ON public.contact_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_window ON public.contact_rate_limits(window_start);

-- 7. Add unique constraint to prevent duplicate rate limit entries per IP
ALTER TABLE public.contact_rate_limits ADD CONSTRAINT unique_ip_per_window UNIQUE (ip_address);