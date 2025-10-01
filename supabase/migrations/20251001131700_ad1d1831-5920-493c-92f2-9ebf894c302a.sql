
-- Update the Q3 2025 payout to link to George (WR-2025-0008) and fix the royalty amounts
UPDATE public.payouts
SET
  payee_id = (
    SELECT p.id 
    FROM public.payees p
    JOIN public.writers w ON p.writer_id = w.id
    WHERE w.writer_id = 'WR-2025-0008'
    LIMIT 1
  ),
  total_royalties = 100.00,
  gross_royalties = 100.00,
  net_royalties = 100.00,
  net_payable = 100.00,
  amount_due = 100.00,
  updated_at = now()
WHERE id = '5aa9856a-3d48-48a6-923d-d3bb23dc6b94'
  AND period = 'Q3 2025';
