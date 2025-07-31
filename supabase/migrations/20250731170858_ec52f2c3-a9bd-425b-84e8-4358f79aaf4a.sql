-- Create invoice templates table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync invoices table
CREATE TABLE IF NOT EXISTS public.sync_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.sync_licenses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  invoice_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_templates
CREATE POLICY "Users can view their own invoice templates" 
ON public.invoice_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoice templates" 
ON public.invoice_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice templates" 
ON public.invoice_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice templates" 
ON public.invoice_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for sync_invoices
CREATE POLICY "Users can view their own sync invoices" 
ON public.sync_invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync invoices" 
ON public.sync_invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync invoices" 
ON public.sync_invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync invoices" 
ON public.sync_invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_templates_user_id ON public.invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_default ON public.invoice_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_sync_invoices_user_id ON public.sync_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_invoices_license_id ON public.sync_invoices(license_id);
CREATE INDEX IF NOT EXISTS idx_sync_invoices_status ON public.sync_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sync_invoices_invoice_number ON public.sync_invoices(invoice_number);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_sync_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_templates_updated_at
BEFORE UPDATE ON public.invoice_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_templates_updated_at();

CREATE TRIGGER update_sync_invoices_updated_at
BEFORE UPDATE ON public.sync_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_sync_invoices_updated_at();