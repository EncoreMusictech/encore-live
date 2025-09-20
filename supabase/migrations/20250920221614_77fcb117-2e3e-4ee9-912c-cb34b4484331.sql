-- Update existing client portal access for info@encoremusic.tech to admin role
-- This ensures they have full admin permissions in the client portal

UPDATE public.client_portal_access 
SET 
  role = 'admin',
  permissions = '{"contracts": {"enabled": true}, "copyright": {"enabled": true}, "royalties": {"enabled": true}, "sync_licenses": {"enabled": true}}'::jsonb,
  status = 'active',
  updated_at = NOW()
WHERE client_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech')
AND subscriber_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech');