-- Update existing payout records to trigger the calculation function
-- This will populate the new total_royalties and commissions_amount fields
UPDATE public.payouts 
SET updated_at = now()
WHERE total_royalties = 0 OR total_royalties IS NULL;