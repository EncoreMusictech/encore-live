-- Create a function to grant demo access to the demo user
CREATE OR REPLACE FUNCTION public.grant_demo_access_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        'copyright-management',
        'sync-licensing'
      ]) as module_id,
      'free_tier' as access_source,
      now() as granted_at
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      granted_at = EXCLUDED.granted_at;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic demo access
DROP TRIGGER IF EXISTS on_demo_user_created ON auth.users;
CREATE TRIGGER on_demo_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_demo_access_on_signup();