
-- Remove client_portal_access records for PAQ Publishing team members
-- These users are company_users (sub-account team), not client portal users
DELETE FROM public.client_portal_access 
WHERE client_user_id IN (
  '2e2b5903-32ad-44d5-9ab4-40e58a64ee77',  -- dilip
  '13035cc4-cd87-4c04-a6a3-749e6ec1615c'   -- tpatt
);

-- Kenneth's client_portal_access has subscriber=encore support, also remove
DELETE FROM public.client_portal_access 
WHERE client_user_id = '9c74ff74-4319-4b95-800d-a505e7a815a0';
