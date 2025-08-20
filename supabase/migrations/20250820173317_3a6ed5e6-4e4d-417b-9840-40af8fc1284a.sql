-- Add foreign key constraint between quarterly_balance_reports and payees
-- First, let's check if payee_id values are valid UUIDs that exist in payees table
-- Clean up any invalid payee_id references first
DELETE FROM public.quarterly_balance_reports 
WHERE payee_id NOT IN (SELECT id FROM public.payees);

-- Now add the foreign key constraint
ALTER TABLE public.quarterly_balance_reports
ADD CONSTRAINT fk_quarterly_balance_reports_payee_id
FOREIGN KEY (payee_id) REFERENCES public.payees(id) ON DELETE CASCADE;