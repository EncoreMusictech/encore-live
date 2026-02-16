INSERT INTO public.user_module_access (user_id, module_id, access_source)
VALUES ('d2005882-9591-4564-b3e1-48617dc3bc1d', 'royalties-processing', 'demo_access')
ON CONFLICT DO NOTHING;