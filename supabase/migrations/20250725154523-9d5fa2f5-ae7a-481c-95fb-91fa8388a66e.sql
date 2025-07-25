-- Add a new column to store expense flags as JSON
ALTER TABLE public.payout_expenses 
ADD COLUMN expense_flags jsonb DEFAULT '{}'::jsonb;

-- Migrate existing data from individual boolean columns to the new JSON column
UPDATE public.payout_expenses 
SET expense_flags = jsonb_build_object(
    'recoupable', COALESCE(is_recoupable, false),
    'commission_fee', COALESCE(is_commission_fee, false),
    'finder_fee', COALESCE(is_finder_fee, false)
)
WHERE expense_flags = '{}'::jsonb;