
-- Revert PAQ Publishing to independent sub-account (not child of Myind Sound)
UPDATE public.companies 
SET parent_company_id = NULL,
    company_type = 'publishing_firm'
WHERE id = '19af11f1-5f9a-468d-9d41-88172fc969a2';

-- Remove Myind Sound admin from PAQ (they shouldn't be there)
DELETE FROM public.company_users 
WHERE company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
AND user_id = '202e270f-9520-4d74-9ad3-74d007e055cf';

-- Ensure dilip and tpatt are admin members of PAQ Publishing
UPDATE public.company_users 
SET role = 'admin'
WHERE company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
AND user_id IN ('2e2b5903-32ad-44d5-9ab4-40e58a64ee77', '13035cc4-cd87-4c04-a6a3-749e6ec1615c');

-- Reassign invitations to dilip (PAQ's own admin) as subscriber
UPDATE public.client_invitations 
SET subscriber_user_id = '2e2b5903-32ad-44d5-9ab4-40e58a64ee77'
WHERE email IN ('dilip@paqpublishing.com', 'tpatt@manticoremusic.com', 'bobbyhustle@me.com');

-- Reassign client_portal_access subscriber to dilip
UPDATE public.client_portal_access 
SET subscriber_user_id = '2e2b5903-32ad-44d5-9ab4-40e58a64ee77'
WHERE client_user_id IN ('2e2b5903-32ad-44d5-9ab4-40e58a64ee77', '13035cc4-cd87-4c04-a6a3-749e6ec1615c');
