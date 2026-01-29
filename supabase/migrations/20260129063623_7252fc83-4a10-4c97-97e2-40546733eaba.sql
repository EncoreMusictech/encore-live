-- Mark Myind Sound as internal enterprise (no payment required)
UPDATE public.companies
SET subscription_tier = 'enterprise_internal',
    subscription_status = COALESCE(subscription_status, 'active'),
    updated_at = now()
WHERE id = 'b8dc2bf6-5f45-435e-b26a-2d1e1d36a5eb';