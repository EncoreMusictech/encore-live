-- Add beginning balance columns to payees table
ALTER TABLE public.payees 
ADD COLUMN IF NOT EXISTS beginning_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS beginning_balance_as_of_date date,
ADD COLUMN IF NOT EXISTS beginning_balance_notes text;

-- Add comment for documentation
COMMENT ON COLUMN public.payees.beginning_balance IS 'Initial account balance when starting to use the system';
COMMENT ON COLUMN public.payees.beginning_balance_as_of_date IS 'Effective date of the beginning balance';
COMMENT ON COLUMN public.payees.beginning_balance_notes IS 'Notes about the source or reason for the beginning balance';