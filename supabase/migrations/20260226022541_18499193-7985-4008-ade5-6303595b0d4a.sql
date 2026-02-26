
-- Create platform error logs table for tracking all system errors
CREATE TABLE public.platform_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,
  error_source TEXT NOT NULL, -- e.g. 'bulk-upload', 'contract-upload', 'catalog-import', 'edge-function', 'api-call'
  error_type TEXT NOT NULL, -- e.g. 'validation', 'network', 'auth', 'database', 'file-processing', 'unknown'
  error_message TEXT NOT NULL,
  error_details JSONB, -- stack traces, request/response data, context
  module TEXT, -- e.g. 'copyrights', 'contracts', 'catalog', 'royalties', 'settings'
  action TEXT, -- e.g. 'create', 'update', 'delete', 'upload', 'import'
  severity TEXT NOT NULL DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Enable RLS
ALTER TABLE public.platform_error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins (via has_role) can read error logs
CREATE POLICY "Admins can view all error logs"
  ON public.platform_error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can insert error logs (so the frontend can log errors)
CREATE POLICY "Authenticated users can insert error logs"
  ON public.platform_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update error logs (to mark as resolved)
CREATE POLICY "Admins can update error logs"
  ON public.platform_error_logs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for common queries
CREATE INDEX idx_platform_error_logs_created_at ON public.platform_error_logs(created_at DESC);
CREATE INDEX idx_platform_error_logs_severity ON public.platform_error_logs(severity);
CREATE INDEX idx_platform_error_logs_resolved ON public.platform_error_logs(resolved);
CREATE INDEX idx_platform_error_logs_source ON public.platform_error_logs(error_source);
