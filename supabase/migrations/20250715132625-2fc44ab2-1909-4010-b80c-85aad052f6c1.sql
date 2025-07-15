-- Clean up all demo user related triggers and functions
DROP TRIGGER IF EXISTS on_demo_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.grant_demo_access() CASCADE;
DROP FUNCTION IF EXISTS public.grant_demo_access_on_signup() CASCADE;

-- Temporarily disable the access_source constraint 
ALTER TABLE public.user_module_access DROP CONSTRAINT IF EXISTS user_module_access_access_source_check;

-- Recreate the constraint with additional allowed values
ALTER TABLE public.user_module_access ADD CONSTRAINT user_module_access_access_source_check 
CHECK (access_source = ANY (ARRAY['module_subscription'::text, 'bundle_subscription'::text, 'free_tier'::text, 'demo_access'::text]));

-- Now create demo user with proper access
DO $$
DECLARE
    demo_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
BEGIN
    -- Clean up any existing demo user
    DELETE FROM public.user_module_access WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'info@encoremusic.tech'
    );
    DELETE FROM auth.users WHERE email = 'info@encoremusic.tech';
    
    -- Insert demo user
    INSERT INTO auth.users (
        id,
        email, 
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'info@encoremusic.tech',
        '$2a$10$F7ZfzWtPXs7qyKjHmBYdNOYr8qpKhXvPZs6KQNEYVkV5HGlYrYqQy',
        now(),
        now(),
        now()
    );
    
    -- Grant demo access
    INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
    VALUES 
        (demo_user_id, 'catalog-valuation', 'demo_access', now()),
        (demo_user_id, 'deal-simulator', 'demo_access', now()),
        (demo_user_id, 'contract-management', 'demo_access', now()),
        (demo_user_id, 'copyright-management', 'demo_access', now()),
        (demo_user_id, 'sync-licensing', 'demo_access', now());
        
END $$;