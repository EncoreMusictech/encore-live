
-- Alter payout_expenses table to add new fields
ALTER TABLE public.payout_expenses 
ADD COLUMN IF NOT EXISTS agreement_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payee_id uuid REFERENCES public.payees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expense_behavior text CHECK (expense_behavior IN ('crossed', 'direct')) DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS is_commission_fee boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_finder_fee boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS valid_from_date date,
ADD COLUMN IF NOT EXISTS valid_to_date date,
ADD COLUMN IF NOT EXISTS expense_cap numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_id uuid REFERENCES public.copyrights(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recoupable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_url text,
ADD COLUMN IF NOT EXISTS date_incurred date,
ADD COLUMN IF NOT EXISTS expense_status text CHECK (expense_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payout_expenses_user_id ON public.payout_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_expenses_agreement_id ON public.payout_expenses(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payout_expenses_payee_id ON public.payout_expenses(payee_id);
CREATE INDEX IF NOT EXISTS idx_payout_expenses_work_id ON public.payout_expenses(work_id);
