-- Create comprehensive SOC2-compliant audit log table
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  session_id TEXT,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_user_id ON public.system_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_category ON public.system_audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON public.system_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_resource ON public.system_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_session ON public.system_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_severity ON public.system_audit_logs(severity);

-- Enable RLS
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.system_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own audit logs
CREATE POLICY "Users can insert audit logs"
  ON public.system_audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Add terms_version column to profiles for version tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_version TEXT,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;

-- Create function to automatically log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.system_audit_logs (
      user_id,
      user_email,
      category,
      action,
      resource_type,
      resource_id,
      description,
      old_values,
      new_values,
      severity
    )
    VALUES (
      NEW.id,
      (SELECT email FROM auth.users WHERE id = NEW.id),
      'user_management',
      'update',
      'profile',
      NEW.id::text,
      'Profile updated',
      to_jsonb(OLD),
      to_jsonb(NEW),
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS trigger_log_profile_changes ON public.profiles;
CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- Create function to log authentication events (can be called from edge functions)
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.system_audit_logs (
    user_id,
    user_email,
    category,
    action,
    description,
    metadata,
    severity
  )
  VALUES (
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    'authentication',
    p_action,
    'Authentication event: ' || p_action,
    p_metadata,
    CASE WHEN p_action = 'login_failed' THEN 'warning' ELSE 'info' END
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;