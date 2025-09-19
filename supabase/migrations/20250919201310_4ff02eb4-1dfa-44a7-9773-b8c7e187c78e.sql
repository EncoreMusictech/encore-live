-- Add all existing authenticated users to the Encore Music company with correct role
DO $$
DECLARE
    encore_company_id uuid;
    user_record record;
    owner_exists boolean := false;
BEGIN
    -- Get the Encore Music company ID
    SELECT id INTO encore_company_id 
    FROM public.companies 
    WHERE name = 'Encore Music' 
    LIMIT 1;
    
    -- Check if an owner already exists for Encore Music
    SELECT EXISTS(
        SELECT 1 FROM public.company_users 
        WHERE company_id = encore_company_id AND role = 'owner'
    ) INTO owner_exists;
    
    -- Add all authenticated users to Encore Music company if they're not already added
    FOR user_record IN 
        SELECT DISTINCT id as user_id 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        -- If no owner exists yet, make the first user an owner, others are users
        INSERT INTO public.company_users (
            company_id, user_id, role, status, joined_at
        )
        VALUES (
            encore_company_id, 
            user_record.user_id, 
            CASE WHEN NOT owner_exists THEN 'owner' ELSE 'user' END,
            'active', 
            now()
        )
        ON CONFLICT (company_id, user_id) DO NOTHING;
        
        -- After first user, all others should be 'user' role
        owner_exists := true;
    END LOOP;
    
    RAISE NOTICE 'Added users to Encore Music company: %', encore_company_id;
END $$;