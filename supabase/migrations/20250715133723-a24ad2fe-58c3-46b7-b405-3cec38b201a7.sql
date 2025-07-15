-- Clean up the manually inserted user that's causing schema issues
DELETE FROM public.user_module_access WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech'
);
DELETE FROM auth.users WHERE email = 'info@encoremusic.tech';