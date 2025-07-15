-- Create activity log table for tracking copyright operations
CREATE TABLE public.copyright_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  copyright_id UUID REFERENCES public.copyrights(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'bulk_upload')),
  operation_details JSONB DEFAULT '{}',
  affected_fields TEXT[],
  old_values JSONB,
  new_values JSONB,
  batch_id UUID, -- For grouping bulk operations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.copyright_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.copyright_activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
ON public.copyright_activity_logs
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_copyright_activity_logs_user_id ON public.copyright_activity_logs(user_id);
CREATE INDEX idx_copyright_activity_logs_copyright_id ON public.copyright_activity_logs(copyright_id);
CREATE INDEX idx_copyright_activity_logs_created_at ON public.copyright_activity_logs(created_at DESC);
CREATE INDEX idx_copyright_activity_logs_batch_id ON public.copyright_activity_logs(batch_id) WHERE batch_id IS NOT NULL;

-- Create function to log copyright activities
CREATE OR REPLACE FUNCTION public.log_copyright_activity(
  p_user_id UUID,
  p_copyright_id UUID,
  p_action_type TEXT,
  p_operation_details JSONB DEFAULT '{}',
  p_affected_fields TEXT[] DEFAULT '{}',
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.copyright_activity_logs (
    user_id,
    copyright_id,
    action_type,
    operation_details,
    affected_fields,
    old_values,
    new_values,
    batch_id,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_copyright_id,
    p_action_type,
    p_operation_details,
    p_affected_fields,
    p_old_values,
    p_new_values,
    p_batch_id,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;