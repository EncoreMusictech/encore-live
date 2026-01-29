-- Update Myind Sound to be a publishing firm with enterprise tier
UPDATE public.companies 
SET company_type = 'publishing_firm', 
    subscription_tier = 'enterprise',
    updated_at = now()
WHERE id = 'b8dc2bf6-5f45-435e-b26a-2d1e1d36a5eb';