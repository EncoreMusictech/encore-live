INSERT INTO public.user_roles (user_id, role)
VALUES ('1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;