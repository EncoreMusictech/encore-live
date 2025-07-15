-- Fix the demo access trigger to use a valid access_source value
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
    VALUES 
      (NEW.id, 'catalog-valuation', 'free_tier', now()),
      (NEW.id, 'deal-simulator', 'free_tier', now()),
      (NEW.id, 'contract-management', 'free_tier', now()),
      (NEW.id, 'copyright-management', 'free_tier', now()),
      (NEW.id, 'sync-licensing', 'free_tier', now())
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      granted_at = EXCLUDED.granted_at;
  END IF;
  
  RETURN NEW;
END;
$$;