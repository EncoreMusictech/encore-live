
-- One-time data migration to reassign PAQ Publishing under Myind Sound

-- Set PAQ Publishing as child of Myind Sound
UPDATE public.companies 
SET parent_company_id = 'b8dc2bf6-5f45-435e-b26a-2d1e1d36a5eb',
    company_type = 'client_label'
WHERE id = '19af11f1-5f9a-468d-9d41-88172fc969a2';

-- Add Myind Sound admin as PAQ admin
INSERT INTO public.company_users (company_id, user_id, role, status)
VALUES ('19af11f1-5f9a-468d-9d41-88172fc969a2', '202e270f-9520-4d74-9ad3-74d007e055cf', 'admin', 'active')
ON CONFLICT DO NOTHING;

-- Reassign invitations to Myind Sound user
UPDATE public.client_invitations 
SET subscriber_user_id = '202e270f-9520-4d74-9ad3-74d007e055cf'
WHERE email IN ('dilip@paqpublishing.com', 'tpatt@manticoremusic.com', 'bobbyhustle@me.com');

-- Reassign client_portal_access to Myind Sound user  
UPDATE public.client_portal_access 
SET subscriber_user_id = '202e270f-9520-4d74-9ad3-74d007e055cf'
WHERE client_user_id IN ('2e2b5903-32ad-44d5-9ab4-40e58a64ee77', '13035cc4-cd87-4c04-a6a3-749e6ec1615c');

-- Move company_users from Demo Company to PAQ Publishing
UPDATE public.company_users 
SET company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
WHERE user_id IN ('2e2b5903-32ad-44d5-9ab4-40e58a64ee77', '13035cc4-cd87-4c04-a6a3-749e6ec1615c')
AND company_id = '0b7af1c7-1c9b-45ed-a204-d475e60d76fb';
