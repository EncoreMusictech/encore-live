-- 1. Create "Demo Music Publishing" company with valid company_type
INSERT INTO companies (name, display_name, slug, company_type, contact_email, created_by)
VALUES (
  'Demo Music Publishing', 
  'Demo Music Publishing', 
  'demo-music-publishing', 
  'standard', 
  'demo@encoremusic.tech', 
  'd2005882-9591-4564-b3e1-48617dc3bc1d'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Remove demo user from any existing company memberships
DELETE FROM company_users 
WHERE user_id = 'd2005882-9591-4564-b3e1-48617dc3bc1d';

-- 3. Link demo user to Demo Music Publishing
INSERT INTO company_users (company_id, user_id, role, status, joined_at)
SELECT id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'admin', 'active', now()
FROM companies WHERE slug = 'demo-music-publishing';

-- 4. Seed demo messages
INSERT INTO company_messages (company_id, sender_id, sender_email, sender_name, content, is_encore_admin, created_at, read_by)
SELECT c.id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'demo@encoremusic.tech', 'Demo User',
  'Hi team! I just uploaded my Q1 royalty statements. Can you confirm they have been processed?',
  false, now() - interval '4 hours', '[]'::jsonb
FROM companies c WHERE c.slug = 'demo-music-publishing';

INSERT INTO company_messages (company_id, sender_id, sender_email, sender_name, content, is_encore_admin, created_at, read_by)
SELECT c.id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'support@encoremusic.tech', 'ENCORE Support',
  'Hi! Yes, we have received your Q1 statements. Processing is underway and you will see updated balances within 24 hours.',
  true, now() - interval '3 hours', '[]'::jsonb
FROM companies c WHERE c.slug = 'demo-music-publishing';

INSERT INTO company_messages (company_id, sender_id, sender_email, sender_name, content, is_encore_admin, created_at, read_by)
SELECT c.id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'demo@encoremusic.tech', 'Demo User',
  'Great, thank you! Also, I noticed a new sync opportunity notification. Is that from the Netflix brief?',
  false, now() - interval '2 hours', '[]'::jsonb
FROM companies c WHERE c.slug = 'demo-music-publishing';

INSERT INTO company_messages (company_id, sender_id, sender_email, sender_name, content, is_encore_admin, created_at, read_by)
SELECT c.id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'support@encoremusic.tech', 'ENCORE Support',
  'That is correct! Netflix is looking for indie-pop tracks for their upcoming series. Your catalog is a strong match. Would you like us to submit on your behalf?',
  true, now() - interval '1 hour', '[]'::jsonb
FROM companies c WHERE c.slug = 'demo-music-publishing';

INSERT INTO company_messages (company_id, sender_id, sender_email, sender_name, content, is_encore_admin, created_at, read_by)
SELECT c.id, 'd2005882-9591-4564-b3e1-48617dc3bc1d', 'demo@encoremusic.tech', 'Demo User',
  'Yes, please go ahead and submit! Let me know if you need any additional metadata or stems.',
  false, now() - interval '30 minutes', '[]'::jsonb
FROM companies c WHERE c.slug = 'demo-music-publishing';