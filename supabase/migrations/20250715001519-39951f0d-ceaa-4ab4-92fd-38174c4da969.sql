-- Create demo user account if it doesn't exist
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Check if demo user already exists
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'info@encoremusic.tech';
  
  -- If demo user doesn't exist, create it
  IF demo_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'info@encoremusic.tech',
      crypt('demo123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO demo_user_id;
  END IF;
  
  -- Grant module access for demo user
  INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
  SELECT 
    demo_user_id,
    unnest(ARRAY[
      'catalog-valuation',
      'deal-simulator', 
      'contract-management',
      'copyright-management',
      'sync-licensing'
    ]) as module_id,
    'demo_access' as access_source,
    now() as granted_at
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    access_source = EXCLUDED.access_source,
    granted_at = EXCLUDED.granted_at;
    
  RAISE NOTICE 'Demo user setup completed for user: %', demo_user_id;
END $$;