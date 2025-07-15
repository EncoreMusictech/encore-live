-- Remove the problematic trigger and create demo user manually
DROP TRIGGER IF EXISTS on_demo_user_created ON auth.users;

-- Create demo user manually with proper access
DO $$
DECLARE
    demo_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Fixed UUID for demo user
BEGIN
    -- Delete existing demo user if exists
    DELETE FROM public.user_module_access WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech'
    );
    DELETE FROM auth.users WHERE email = 'info@encoremusic.tech';
    
    -- Insert demo user with fixed UUID
    INSERT INTO auth.users (
        id,
        email, 
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        demo_user_id,
        'info@encoremusic.tech',
        '$2a$10$F7ZfzWtPXs7qyKjHmBYdNOYr8qpKhXvPZs6KQNEYVkV5HGlYrYqQy', -- bcrypt hash for 'demo123'
        now(),
        now(),
        now(),
        '',
        '',
        ''
    );
    
    -- Grant module access for demo user
    INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
    VALUES 
        (demo_user_id, 'catalog-valuation', 'free_tier', now()),
        (demo_user_id, 'deal-simulator', 'free_tier', now()),
        (demo_user_id, 'contract-management', 'free_tier', now()),
        (demo_user_id, 'copyright-management', 'free_tier', now()),
        (demo_user_id, 'sync-licensing', 'free_tier', now())
    ON CONFLICT (user_id, module_id) DO NOTHING;
    
END $$;