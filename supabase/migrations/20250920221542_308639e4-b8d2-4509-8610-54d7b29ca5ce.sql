-- Create active client portal access for info@encoremusic.tech
-- This allows the admin email to access the client portal when needed

INSERT INTO public.client_portal_access (
  subscriber_user_id,
  client_user_id, 
  role,
  permissions,
  status,
  created_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech') as subscriber_user_id,
  (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech') as client_user_id,
  'admin' as role,
  '{"contracts": {"enabled": true}, "copyright": {"enabled": true}, "royalties": {"enabled": true}, "sync_licenses": {"enabled": true}}'::jsonb as permissions,
  'active' as status,
  NOW() as created_at
WHERE (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech') IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.client_portal_access 
  WHERE client_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech')
  AND subscriber_user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech')
  AND status = 'active'
);