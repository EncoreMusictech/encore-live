-- Create active client portal invitation for janishiajones@gmail.com
-- This creates an invitation that grants access to all available portal modules

INSERT INTO public.client_invitations (
  subscriber_user_id,
  email,
  role,
  permissions,
  status,
  expires_at,
  created_at
) 
SELECT 
  auth.uid() as subscriber_user_id,
  'janishiajones@gmail.com' as email,
  'client' as role,
  '{"contracts": true, "copyright": true, "royalties": true, "sync_licenses": true}'::jsonb as permissions,
  'pending' as status,
  NOW() + INTERVAL '30 days' as expires_at,  -- 30 days to accept
  NOW() as created_at
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.client_invitations 
  WHERE email = 'janishiajones@gmail.com' 
  AND subscriber_user_id = auth.uid()
  AND status = 'pending'
);

-- Optionally create direct client portal access (bypassing invitation acceptance)
-- Uncomment the below INSERT if you want immediate active access instead of pending invitation

/*
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
*/