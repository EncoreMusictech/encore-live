-- Create active demo user with full access
DO $$
DECLARE
    demo_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
BEGIN
    -- Clean up any existing demo user
    DELETE FROM public.user_module_access WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech'
    );
    DELETE FROM auth.users WHERE email = 'info@encoremusic.tech';
    
    -- Insert active demo user
    INSERT INTO auth.users (
        id,
        instance_id,
        email, 
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        demo_user_id,
        '00000000-0000-0000-0000-000000000000',
        'info@encoremusic.tech',
        '$2a$10$F7ZfzWtPXs7qyKjHmBYdNOYr8qpKhXvPZs6KQNEYVkV5HGlYrYqQy', -- bcrypt hash for 'demo123'
        now(),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '',
        '',
        ''
    );
    
    -- Grant access to all available modules
    INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
    VALUES 
        (demo_user_id, 'catalog-valuation', 'demo_access', now()),
        (demo_user_id, 'deal-simulator', 'demo_access', now()),
        (demo_user_id, 'contract-management', 'demo_access', now()),
        (demo_user_id, 'copyright-management', 'demo_access', now()),
        (demo_user_id, 'sync-licensing', 'demo_access', now())
    ON CONFLICT (user_id, module_id) DO UPDATE SET
        access_source = EXCLUDED.access_source,
        granted_at = EXCLUDED.granted_at;
        
END $$;