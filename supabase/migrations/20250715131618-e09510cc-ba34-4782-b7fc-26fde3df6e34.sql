-- Check if demo user exists and clean up if needed
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Check if demo user exists
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'info@encoremusic.tech';
    
    -- If demo user exists, clean up their module access and delete the user
    IF demo_user_id IS NOT NULL THEN
        DELETE FROM public.user_module_access WHERE user_id = demo_user_id;
        DELETE FROM auth.users WHERE id = demo_user_id;
    END IF;
END $$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_demo_user_created ON auth.users;
CREATE TRIGGER on_demo_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_demo_access_on_signup();