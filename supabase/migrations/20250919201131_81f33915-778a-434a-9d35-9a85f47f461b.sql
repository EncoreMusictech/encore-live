-- Add all existing authenticated users to the Encore Music company
DO $$
DECLARE
    encore_company_id uuid;
    user_record record;
BEGIN
    -- Get the Encore Music company ID
    SELECT id INTO encore_company_id 
    FROM public.companies 
    WHERE name = 'Encore Music' 
    LIMIT 1;
    
    -- If Encore Music company doesn't exist, create it
    IF encore_company_id IS NULL THEN
        INSERT INTO public.companies (
            name, display_name, slug, contact_email, 
            subscription_tier, subscription_status
        ) 
        VALUES (
            'Encore Music', 'Encore Music', 'encore-music', 
            'info@encoremusic.tech', 'enterprise', 'active'
        )
        RETURNING id INTO encore_company_id;
    END IF;
    
    -- Add all authenticated users to Encore Music company if they're not already added
    FOR user_record IN 
        SELECT DISTINCT id as user_id 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        INSERT INTO public.company_users (
            company_id, user_id, role, status, joined_at
        )
        VALUES (
            encore_company_id, user_record.user_id, 'member', 'active', now()
        )
        ON CONFLICT (company_id, user_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Added users to Encore Music company: %', encore_company_id;
END $$;