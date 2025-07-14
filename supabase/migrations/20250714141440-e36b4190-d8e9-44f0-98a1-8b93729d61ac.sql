-- Create contract change log table
CREATE TABLE public.contract_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'field_update', 'status_change', 'document_update', 'sent_for_signature', 'email_sent'
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contract_change_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for contract change logs
CREATE POLICY "Users can view change logs for their contracts"
ON public.contract_change_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_change_logs.contract_id 
  AND contracts.user_id = auth.uid()
));

CREATE POLICY "Users can create change logs for their contracts"
ON public.contract_change_logs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_change_logs.contract_id 
  AND contracts.user_id = auth.uid()
));

-- Add foreign key constraint
ALTER TABLE public.contract_change_logs
ADD CONSTRAINT contract_change_logs_contract_id_fkey
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_contract_change_logs_contract_id ON public.contract_change_logs(contract_id);
CREATE INDEX idx_contract_change_logs_created_at ON public.contract_change_logs(created_at DESC);

-- Add some additional fields to contracts table for better tracking
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS last_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS template_id TEXT;