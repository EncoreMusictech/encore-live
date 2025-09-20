-- Create direct active client portal access for janishiajones@gmail.com
-- This bypasses the invitation flow and gives immediate access

INSERT INTO public.client_portal_access (
  subscriber_user_id,
  client_user_id, 
  role,
  permissions,
  status,
  created_at
)
SELECT 
  auth.uid() as subscriber_user_id,
  (SELECT id FROM auth.users WHERE email = 'janishiajones@gmail.com') as client_user_id,
  'client' as role,
  '{"contracts": {"enabled": true}, "copyright": {"enabled": true}, "royalties": {"enabled": true}, "sync_licenses": {"enabled": true}}'::jsonb as permissions,
  'active' as status,
  NOW() as created_at
WHERE auth.uid() IS NOT NULL
AND (SELECT id FROM auth.users WHERE email = 'janishiajones@gmail.com') IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.client_portal_access 
  WHERE client_user_id = (SELECT id FROM auth.users WHERE email = 'janishiajones@gmail.com')
  AND subscriber_user_id = auth.uid()
  AND status = 'active'
);