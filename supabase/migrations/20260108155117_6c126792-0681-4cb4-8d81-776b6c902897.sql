-- Function to create a company and link user when profile is created/updated
CREATE OR REPLACE FUNCTION public.create_company_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  company_slug text;
  base_slug text;
  counter int := 0;
  user_has_company boolean;
BEGIN
  -- Only proceed if company_name is provided
  IF NEW.company_name IS NULL OR NEW.company_name = '' THEN
    RETURN NEW;
  END IF;

  -- Check if user already has a company (for update trigger)
  SELECT EXISTS (SELECT 1 FROM company_users WHERE user_id = NEW.id) INTO user_has_company;
  
  -- If this is an update and user already has a company, skip
  IF TG_OP = 'UPDATE' AND user_has_company THEN
    RETURN NEW;
  END IF;

  -- Generate a slug from company name
  base_slug := lower(regexp_replace(NEW.company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  company_slug := base_slug;
  
  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = company_slug) LOOP
    counter := counter + 1;
    company_slug := base_slug || '-' || counter;
  END LOOP;

  -- Create the company
  INSERT INTO companies (
    name,
    display_name,
    slug,
    created_by,
    subscription_status,
    module_access
  ) VALUES (
    NEW.company_name,
    NEW.company_name,
    company_slug,
    NEW.id,
    'trial',
    '[]'::jsonb
  )
  RETURNING id INTO new_company_id;

  -- Link user to company as owner
  INSERT INTO company_users (
    company_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    new_company_id,
    NEW.id,
    'owner',
    'active',
    now()
  );

  RETURN NEW;
END;
$$;

-- Create trigger to fire after profile insert (when company_name is set)
DROP TRIGGER IF EXISTS trigger_create_company_for_new_user ON profiles;
CREATE TRIGGER trigger_create_company_for_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.company_name IS NOT NULL AND NEW.company_name != '')
  EXECUTE FUNCTION create_company_for_new_user();

-- Also handle updates to company_name (if user adds it later)
DROP TRIGGER IF EXISTS trigger_create_company_on_update ON profiles;
CREATE TRIGGER trigger_create_company_on_update
  AFTER UPDATE OF company_name ON profiles
  FOR EACH ROW
  WHEN (OLD.company_name IS DISTINCT FROM NEW.company_name AND NEW.company_name IS NOT NULL AND NEW.company_name != '')
  EXECUTE FUNCTION create_company_for_new_user();

-- Function to grant module access to a company when trial/subscription starts
CREATE OR REPLACE FUNCTION public.grant_company_module_access_on_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_company_id uuid;
  module_id text;
BEGIN
  -- Get the user's company
  SELECT cu.company_id INTO user_company_id
  FROM company_users cu
  WHERE cu.user_id = NEW.user_id
  AND cu.status = 'active'
  ORDER BY cu.created_at ASC
  LIMIT 1;

  -- If user has no company, skip
  IF user_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Grant access to each module in the trial
  IF NEW.trial_modules IS NOT NULL AND array_length(NEW.trial_modules, 1) > 0 THEN
    FOREACH module_id IN ARRAY NEW.trial_modules
    LOOP
      INSERT INTO company_module_access (company_id, module_id, enabled)
      VALUES (user_company_id, module_id, true)
      ON CONFLICT (company_id, module_id) 
      DO UPDATE SET enabled = true, updated_at = now();
    END LOOP;
  END IF;

  -- Update company subscription status
  UPDATE companies
  SET 
    subscription_status = 'trial',
    subscription_end = NEW.trial_end_date,
    updated_at = now()
  WHERE id = user_company_id;

  RETURN NEW;
END;
$$;

-- Create trigger for when a free trial is started
DROP TRIGGER IF EXISTS trigger_grant_module_access_on_trial ON user_free_trials;
CREATE TRIGGER trigger_grant_module_access_on_trial
  AFTER INSERT ON user_free_trials
  FOR EACH ROW
  EXECUTE FUNCTION grant_company_module_access_on_trial();

-- Function to check if user has module access through their company
CREATE OR REPLACE FUNCTION public.user_has_module_access(p_user_id uuid, p_module_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_users cu
    JOIN company_module_access cma ON cu.company_id = cma.company_id
    WHERE cu.user_id = p_user_id
    AND cu.status = 'active'
    AND cma.module_id = p_module_id
    AND cma.enabled = true
  )
  OR EXISTS (
    -- Also check for active free trials
    SELECT 1 
    FROM user_free_trials uft
    WHERE uft.user_id = p_user_id
    AND uft.trial_status = 'active'
    AND uft.trial_end_date > now()
    AND p_module_id = ANY(uft.trial_modules)
  )
$$;

-- Add unique constraint for company_module_access if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'company_module_access_company_id_module_id_key'
  ) THEN
    ALTER TABLE company_module_access 
    ADD CONSTRAINT company_module_access_company_id_module_id_key 
    UNIQUE (company_id, module_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;