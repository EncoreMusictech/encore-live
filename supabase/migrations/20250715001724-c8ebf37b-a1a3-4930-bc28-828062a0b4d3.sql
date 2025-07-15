-- Remove the incorrectly created demo user
DELETE FROM public.user_module_access WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech');
DELETE FROM auth.users WHERE email = 'info@encoremusic.tech';