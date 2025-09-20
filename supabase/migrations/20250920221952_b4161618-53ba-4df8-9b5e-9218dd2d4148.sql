-- Reactivate client portal access for Janishia Jones (janishiajones@gmail.com)
-- This will restore their access to the client portal

UPDATE public.client_portal_access 
SET 
  status = 'active',
  updated_at = NOW()
WHERE client_user_id = 'f8804014-30a0-421c-ac25-3193152960e7'
AND status = 'revoked';