-- Add visibility_scope column to client_portal_access if it doesn't exist
ALTER TABLE public.client_portal_access 
ADD COLUMN IF NOT EXISTS visibility_scope jsonb DEFAULT '{"scope_type": "all"}'::jsonb;