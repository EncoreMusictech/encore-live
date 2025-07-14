-- Create a function to grant demo access to all modules for the demo user
CREATE OR REPLACE FUNCTION public.grant_demo_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the demo user
  IF NEW.email = 'info@encoremusic.tech' THEN
    -- Grant access to all available modules
    INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
    SELECT 
      NEW.id,
      unnest(ARRAY[
        'catalog-valuation',
        'deal-simulator', 
        'contract-management',
        'copyright-management'
      ]) as module_id,
      'demo_access' as access_source,
      now() as granted_at
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      granted_at = EXCLUDED.granted_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically grant demo access when the demo user signs up
CREATE OR REPLACE TRIGGER grant_demo_access_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_demo_access();

-- Also create a function to manually grant demo access if needed
CREATE OR REPLACE FUNCTION public.setup_demo_user()
RETURNS void AS $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Find the demo user
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'info@encoremusic.tech';
  
  -- If demo user exists, grant access to all modules
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
    SELECT 
      demo_user_id,
      unnest(ARRAY[
        'catalog-valuation',
        'deal-simulator', 
        'contract-management',
        'copyright-management'
      ]) as module_id,
      'demo_access' as access_source,
      now() as granted_at
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      granted_at = EXCLUDED.granted_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;