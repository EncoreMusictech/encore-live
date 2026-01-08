
-- Create the Pellum company for David
INSERT INTO public.companies (id, name, display_name, slug, subscription_tier, subscription_status)
VALUES (
  gen_random_uuid(),
  'Pellum',
  'Pellum',
  'pellum',
  'Enterprise',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Get company id and link David as admin
INSERT INTO public.company_users (company_id, user_id, role, status, joined_at)
SELECT 
  c.id,
  'd69f9851-c35c-4d63-9f8d-f8a77711703a'::uuid,
  'admin',
  'active',
  now()
FROM public.companies c
WHERE c.slug = 'pellum'
ON CONFLICT DO NOTHING;

-- Grant only royalty_processing module access to Pellum company
INSERT INTO public.company_module_access (company_id, module_id, enabled)
SELECT 
  c.id,
  'royalty_processing',
  true
FROM public.companies c
WHERE c.slug = 'pellum'
ON CONFLICT (company_id, module_id) DO UPDATE SET enabled = true;

-- Remove any other module access for this company (ensure ONLY royalties)
DELETE FROM public.company_module_access 
WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'pellum')
AND module_id != 'royalty_processing';

-- Update David's profile with company name
UPDATE public.profiles 
SET company_name = 'Pellum'
WHERE id = 'd69f9851-c35c-4d63-9f8d-f8a77711703a';
