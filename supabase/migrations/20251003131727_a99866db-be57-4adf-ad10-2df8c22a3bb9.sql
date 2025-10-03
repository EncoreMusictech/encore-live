-- Fix Alicia Keys payout by linking the unlinked expense and recalculating totals

-- First, link the expense to the payout based on matching payee_id
UPDATE payout_expenses
SET payout_id = (
  SELECT p.id 
  FROM payouts p
  WHERE p.payee_id = payout_expenses.payee_id
  AND p.period = 'Q4 2025'
  LIMIT 1
)
WHERE payee_id = '6e15d6d0-b80c-4a5b-ad77-05446a591c17'
AND payout_id IS NULL
AND is_recoupable = true
AND expense_status = 'approved';

-- Recalculate the payout totals for Alicia Keys
UPDATE payouts
SET 
  total_expenses = COALESCE((
    SELECT SUM(amount)
    FROM payout_expenses
    WHERE payout_id = payouts.id
    AND expense_status = 'approved'
  ), 0),
  net_payable = gross_royalties - COALESCE((
    SELECT SUM(amount)
    FROM payout_expenses
    WHERE payout_id = payouts.id
    AND expense_status = 'approved'
  ), 0),
  amount_due = gross_royalties - COALESCE((
    SELECT SUM(amount)
    FROM payout_expenses
    WHERE payout_id = payouts.id
    AND expense_status = 'approved'
  ), 0),
  updated_at = now()
WHERE payee_id = '6e15d6d0-b80c-4a5b-ad77-05446a591c17'
AND period = 'Q4 2025';