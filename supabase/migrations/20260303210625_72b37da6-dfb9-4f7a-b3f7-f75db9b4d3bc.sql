-- Fix existing payees, writers, and original_publishers created by admin while viewing PAQ Publishing sub-account
-- Reassign them to PAQ's service account so they appear under PAQ's data scope

-- Get PAQ Publishing's service account user ID: 8dc3b545-71dd-46e9-87bb-8aeb4a990650
-- PAQ Publishing company ID: 19af11f1-5f9a-468d-9d41-88172fc969a2
-- Admin user ID: 5f377ef9-10fe-413c-a3db-3a7b1c77ed6b

-- Update payees that are linked to PAQ's contracts via the writer->original_publisher->contract chain
UPDATE public.payees p
SET user_id = '8dc3b545-71dd-46e9-87bb-8aeb4a990650'
WHERE p.user_id = '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b'
AND p.writer_id IN (
  SELECT w.id FROM public.writers w
  JOIN public.original_publishers op ON w.original_publisher_id = op.id
  JOIN public.contracts c ON op.agreement_id = c.id
  WHERE c.client_company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
);

-- Update writers linked to PAQ's contracts
UPDATE public.writers w
SET user_id = '8dc3b545-71dd-46e9-87bb-8aeb4a990650'
WHERE w.user_id = '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b'
AND w.original_publisher_id IN (
  SELECT op.id FROM public.original_publishers op
  JOIN public.contracts c ON op.agreement_id = c.id
  WHERE c.client_company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
);

-- Update original publishers linked to PAQ's contracts
UPDATE public.original_publishers op
SET user_id = '8dc3b545-71dd-46e9-87bb-8aeb4a990650'
WHERE op.user_id = '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b'
AND op.agreement_id IN (
  SELECT c.id FROM public.contracts c
  WHERE c.client_company_id = '19af11f1-5f9a-468d-9d41-88172fc969a2'
);