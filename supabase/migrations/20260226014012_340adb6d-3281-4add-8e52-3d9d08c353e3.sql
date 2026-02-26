INSERT INTO public.user_roles (user_id, role)
VALUES ('8b8725b8-6bb0-41c1-b256-73020d57a98c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;