-- Grant client portal access to info@encoremusic.tech with admin privileges
DO $$
DECLARE
    target_user_id uuid;
    admin_user_id uuid;
BEGIN
    -- Find the user ID for info@encoremusic.tech
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'info@encoremusic.tech' 
    AND email_confirmed_at IS NOT NULL;
    
    -- Use the same user as both subscriber and client (self-access)
    admin_user_id := target_user_id;
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update client portal access
        INSERT INTO public.client_portal_access (
            client_user_id,
            subscriber_user_id,
            role,
            status,
            permissions,
            expires_at
        ) VALUES (
            target_user_id,
            admin_user_id,
            'admin'::client_role,
            'active',
            jsonb_build_object(
                'contracts', jsonb_build_object('enabled', true, 'write', true),
                'copyright', jsonb_build_object('enabled', true, 'write', true),
                'royalties', jsonb_build_object('enabled', true, 'write', true),
                'sync_deals', jsonb_build_object('enabled', true, 'write', true),
                'notifications', jsonb_build_object('enabled', true, 'write', true),
                'dashboard', jsonb_build_object('enabled', true, 'write', true)
            ),
            NULL -- No expiration for admin access
        )
        ON CONFLICT (client_user_id, subscriber_user_id) 
        DO UPDATE SET
            role = 'admin'::client_role,
            status = 'active',
            permissions = jsonb_build_object(
                'contracts', jsonb_build_object('enabled', true, 'write', true),
                'copyright', jsonb_build_object('enabled', true, 'write', true),
                'royalties', jsonb_build_object('enabled', true, 'write', true),
                'sync_deals', jsonb_build_object('enabled', true, 'write', true),
                'notifications', jsonb_build_object('enabled', true, 'write', true),
                'dashboard', jsonb_build_object('enabled', true, 'write', true)
            ),
            expires_at = NULL,
            updated_at = now();
            
        RAISE NOTICE 'Successfully granted admin client portal access to info@encoremusic.tech (user_id: %)', target_user_id;
    ELSE
        RAISE NOTICE 'User info@encoremusic.tech not found or email not confirmed. Please ensure the user exists in the auth system first.';
    END IF;
END $$;