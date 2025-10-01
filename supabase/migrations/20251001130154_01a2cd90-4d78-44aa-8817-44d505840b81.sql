-- Add payee_id column to payouts table to reference payees instead of contacts
ALTER TABLE public.payouts 
ADD COLUMN payee_id uuid REFERENCES public.payees(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX idx_payouts_payee_id ON public.payouts(payee_id);

-- Optional: Migrate existing data from contacts to payees if there's a matching name
-- This will help preserve existing data
UPDATE public.payouts p
SET payee_id = (
  SELECT payees.id 
  FROM public.payees 
  JOIN public.contacts ON contacts.name = payees.payee_name 
  WHERE contacts.id = p.client_id 
  LIMIT 1
)
WHERE p.payee_id IS NULL;