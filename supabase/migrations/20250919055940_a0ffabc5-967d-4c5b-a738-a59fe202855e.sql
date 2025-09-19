-- Add user to admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('d901d92a-88b3-4b33-973f-850011417266', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;