-- Reactivate client portal access for info@encoremusic.tech
-- Update the existing revoked record to active status

UPDATE public.client_portal_access 
SET 
  status = 'active',
  updated_at = NOW(),
  permissions = '{"contracts": {"enabled": true}, "copyright": {"enabled": true}, "royalties": {"enabled": true}, "sync_licenses": {"enabled": true}}'::jsonb
WHERE client_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech')
AND subscriber_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech')
AND status = 'revoked';