-- Update Myind Sound to Enterprise Internal (non-paying internal account)
UPDATE companies 
SET 
  subscription_tier = 'enterprise_internal',
  subscription_status = 'active',
  updated_at = now()
WHERE id = 'b8dc2bf6-5f45-435e-b26a-2d1e1d36a5eb';