-- =====================================================
-- AUDIT LOGGING SYSTEM FOR SUB-ACCOUNT VIEW MODE
-- =====================================================
-- Tracks when system admins switch to sub-account view mode
-- and monitors all actions they take for compliance

-- =====================================================
-- STEP 1: Create Audit Log Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_view_mode_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  admin_email text NOT NULL,
  
  -- View mode session tracking
  session_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'view_mode_entered',
    'view_mode_exited',
    'data_viewed',
    'data_created',
    'data_updated',
    'data_deleted',
    'export_performed',
    'settings_changed'
  )),
  
  -- Company/sub-account context
  company_id uuid,
  company_name text,
  
  -- Action details
  resource_type text, -- e.g., 'copyright', 'contract', 'payout'
  resource_id uuid,
  action_details jsonb DEFAULT '{}'::jsonb,
  
  -- Security metadata
  ip_address inet,
  user_agent text,
  request_path text,
  
  -- Timing
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_duration_seconds integer,
  
  -- Risk assessment
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_view_mode_audit_admin_user ON public.admin_view_mode_audit(admin_user_id);
CREATE INDEX idx_admin_view_mode_audit_company ON public.admin_view_mode_audit(company_id);
CREATE INDEX idx_admin_view_mode_audit_session ON public.admin_view_mode_audit(session_id);
CREATE INDEX idx_admin_view_mode_audit_created_at ON public.admin_view_mode_audit(created_at DESC);
CREATE INDEX idx_admin_view_mode_audit_action_type ON public.admin_view_mode_audit(action_type);
CREATE INDEX idx_admin_view_mode_audit_risk_level ON public.admin_view_mode_audit(risk_level);

-- =====================================================
-- STEP 2: Create Audit Logging Functions
-- =====================================================

-- Function to log admin view mode actions
CREATE OR REPLACE FUNCTION public.log_admin_view_mode_action(
  p_admin_user_id uuid,
  p_session_id text,
  p_action_type text,
  p_company_id uuid DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_action_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_request_path text DEFAULT NULL,
  p_risk_level text DEFAULT 'low'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  admin_email_var text;
BEGIN
  -- Input validation
  IF p_admin_user_id IS NULL OR p_session_id IS NULL OR p_action_type IS NULL THEN
    RAISE EXCEPTION 'admin_user_id, session_id, and action_type are required';
  END IF;
  
  -- Get admin email
  SELECT email INTO admin_email_var
  FROM auth.users
  WHERE id = p_admin_user_id;
  
  IF admin_email_var IS NULL THEN
    admin_email_var := 'unknown';
  END IF;
  
  -- Insert audit log
  INSERT INTO public.admin_view_mode_audit (
    admin_user_id,
    admin_email,
    session_id,
    action_type,
    company_id,
    company_name,
    resource_type,
    resource_id,
    action_details,
    ip_address,
    user_agent,
    request_path,
    risk_level
  ) VALUES (
    p_admin_user_id,
    admin_email_var,
    p_session_id,
    p_action_type,
    p_company_id,
    p_company_name,
    p_resource_type,
    p_resource_id,
    p_action_details,
    p_ip_address::inet,
    p_user_agent,
    p_request_path,
    p_risk_level
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to close view mode session and calculate duration
CREATE OR REPLACE FUNCTION public.close_admin_view_mode_session(
  p_session_id text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_start timestamp with time zone;
  session_end timestamp with time zone;
  duration_seconds integer;
  admin_id uuid;
  company_id_var uuid;
  company_name_var text;
BEGIN
  -- Get session start time and details
  SELECT created_at, admin_user_id, company_id, company_name
  INTO session_start, admin_id, company_id_var, company_name_var
  FROM public.admin_view_mode_audit
  WHERE session_id = p_session_id
    AND action_type = 'view_mode_entered'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF session_start IS NULL THEN
    RAISE NOTICE 'No session found for session_id: %', p_session_id;
    RETURN;
  END IF;
  
  session_end := now();
  duration_seconds := EXTRACT(EPOCH FROM (session_end - session_start))::integer;
  
  -- Log session exit with duration
  PERFORM public.log_admin_view_mode_action(
    admin_id,
    p_session_id,
    'view_mode_exited',
    company_id_var,
    company_name_var,
    NULL,
    NULL,
    jsonb_build_object(
      'session_start', session_start,
      'session_end', session_end,
      'duration_seconds', duration_seconds
    ),
    p_ip_address,
    p_user_agent,
    NULL,
    CASE 
      WHEN duration_seconds > 3600 THEN 'medium'  -- Over 1 hour
      WHEN duration_seconds > 7200 THEN 'high'     -- Over 2 hours
      ELSE 'low'
    END
  );
  
  -- Update all records in this session with the duration
  UPDATE public.admin_view_mode_audit
  SET session_duration_seconds = duration_seconds
  WHERE session_id = p_session_id
    AND session_duration_seconds IS NULL;
END;
$$;

-- Function to get audit summary for a time period
CREATE OR REPLACE FUNCTION public.get_admin_audit_summary(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_admin_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  admin_user_id uuid,
  admin_email text,
  total_sessions bigint,
  total_actions bigint,
  companies_accessed bigint,
  high_risk_actions bigint,
  avg_session_duration_minutes numeric,
  last_access timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.admin_user_id,
    a.admin_email,
    COUNT(DISTINCT CASE WHEN a.action_type = 'view_mode_entered' THEN a.session_id END) as total_sessions,
    COUNT(*) as total_actions,
    COUNT(DISTINCT a.company_id) as companies_accessed,
    COUNT(*) FILTER (WHERE a.risk_level IN ('high', 'critical')) as high_risk_actions,
    ROUND(AVG(a.session_duration_seconds) / 60.0, 2) as avg_session_duration_minutes,
    MAX(a.created_at) as last_access
  FROM public.admin_view_mode_audit a
  WHERE a.created_at BETWEEN p_start_date AND p_end_date
    AND (p_admin_user_id IS NULL OR a.admin_user_id = p_admin_user_id)
  GROUP BY a.admin_user_id, a.admin_email
  ORDER BY total_actions DESC;
$$;

-- =====================================================
-- STEP 3: Create RLS Policies for Audit Table
-- =====================================================

ALTER TABLE public.admin_view_mode_audit ENABLE ROW LEVEL SECURITY;

-- Only system admins can view audit logs
CREATE POLICY "System admins can view all audit logs"
ON public.admin_view_mode_audit
FOR SELECT
TO authenticated
USING (public.is_system_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
ON public.admin_view_mode_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- (No policies needed - default deny)

-- =====================================================
-- STEP 4: Create Automated Cleanup Function
-- =====================================================

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION public.archive_old_admin_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
BEGIN
  -- In a real system, you might move these to an archive table
  -- For now, we'll just keep logs for 3 years (compliance requirement)
  DELETE FROM public.admin_view_mode_audit
  WHERE created_at < now() - interval '3 years'
    AND risk_level = 'low';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$;

-- =====================================================
-- STEP 5: Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.admin_view_mode_audit IS 'Audit log for tracking system admin actions when viewing as sub-accounts';
COMMENT ON FUNCTION public.log_admin_view_mode_action IS 'Logs admin actions in view mode for compliance and security monitoring';
COMMENT ON FUNCTION public.close_admin_view_mode_session IS 'Closes view mode session and calculates total duration';
COMMENT ON FUNCTION public.get_admin_audit_summary IS 'Returns summary statistics for admin audit logs within a time period';
COMMENT ON FUNCTION public.archive_old_admin_audit_logs IS 'Archives or deletes audit logs older than 3 years (retention policy)';