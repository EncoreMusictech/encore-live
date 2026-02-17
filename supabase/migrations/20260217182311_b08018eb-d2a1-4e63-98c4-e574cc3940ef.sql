
-- Add kennethbrandy@paqpublishing.com as admin of PAQ Publishing
INSERT INTO public.company_users (company_id, user_id, role, status)
VALUES ('19af11f1-5f9a-468d-9d41-88172fc969a2', '9c74ff74-4319-4b95-800d-a505e7a815a0', 'admin', 'active')
ON CONFLICT DO NOTHING;
