-- Update David Pellum's subscription to correct tier and paused status
UPDATE subscribers 
SET 
  subscription_tier = 'Royalties Module',
  subscription_end = NULL,
  updated_at = now()
WHERE user_id = 'd69f9851-c35c-4d63-9f8d-f8a77711703a';

-- Also normalize the module_id in company_module_access to canonical form
UPDATE company_module_access 
SET module_id = 'royalties'
WHERE id = '8a035303-b7e8-4893-addb-1c5098c8378c';