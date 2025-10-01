-- Phase 1: Clean up existing contact-based payouts and unmatched royalties

-- Delete payout_royalties for payouts with client_id but no payee_id
DELETE FROM public.payout_royalties
WHERE payout_id IN (
  SELECT id FROM public.payouts 
  WHERE client_id IS NOT NULL AND payee_id IS NULL
);

-- Delete payouts with client_id but no payee_id
DELETE FROM public.payouts
WHERE client_id IS NOT NULL AND payee_id IS NULL;

-- Delete the "Unmatched Royalties" contact if it exists
DELETE FROM public.contacts
WHERE name = 'Unmatched Royalties' AND contact_type = 'other';

-- Phase 2: Add validation to ensure payee_id is required for new payouts
-- Note: We're not making the column NOT NULL to preserve existing data integrity
-- Instead, we'll add a trigger to validate new inserts

CREATE OR REPLACE FUNCTION public.validate_payout_payee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure all new payouts have a valid payee_id
  IF NEW.payee_id IS NULL THEN
    RAISE EXCEPTION 'Payout must have a valid payee_id. Contact-based payouts are no longer supported.';
  END IF;
  
  -- Verify the payee exists
  IF NOT EXISTS (SELECT 1 FROM public.payees WHERE id = NEW.payee_id) THEN
    RAISE EXCEPTION 'Invalid payee_id: Payee does not exist';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new payout inserts
DROP TRIGGER IF EXISTS validate_payout_payee_trigger ON public.payouts;
CREATE TRIGGER validate_payout_payee_trigger
  BEFORE INSERT ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payout_payee();

-- Add comment to document the change
COMMENT ON TRIGGER validate_payout_payee_trigger ON public.payouts IS 
'Ensures all new payouts have a valid payee_id. Contact-based payouts are deprecated.';