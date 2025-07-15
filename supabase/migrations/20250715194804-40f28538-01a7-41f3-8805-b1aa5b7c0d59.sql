-- Create enum types for royalties system
CREATE TYPE royalty_source AS ENUM ('DSP', 'PRO', 'YouTube', 'Other');
CREATE TYPE batch_status AS ENUM ('Pending', 'Imported', 'Processed');
CREATE TYPE payment_method AS ENUM ('ACH', 'Wire', 'PayPal', 'Check');
CREATE TYPE controlled_status AS ENUM ('Controlled', 'Non-Controlled');

-- Create contacts table for writers, clients, publishers
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_type TEXT NOT NULL DEFAULT 'writer', -- writer, publisher, client
  tax_id TEXT,
  payment_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation_batches table
CREATE TABLE public.reconciliation_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id TEXT NOT NULL,
  source royalty_source NOT NULL,
  statement_period_start DATE,
  statement_period_end DATE,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  total_gross_amount NUMERIC(10,2) DEFAULT 0,
  statement_file_url TEXT,
  status batch_status NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create royalty_allocations table
CREATE TABLE public.royalty_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_id TEXT,
  batch_id UUID REFERENCES public.reconciliation_batches(id) ON DELETE CASCADE,
  copyright_id UUID REFERENCES public.copyrights(id) ON DELETE SET NULL,
  song_title TEXT NOT NULL,
  isrc TEXT,
  artist TEXT,
  gross_royalty_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  controlled_status controlled_status DEFAULT 'Non-Controlled',
  recoupable_expenses BOOLEAN DEFAULT false,
  contract_terms JSONB DEFAULT '{}',
  ownership_splits JSONB DEFAULT '{}',
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create royalty_writers junction table for many-to-many relationship
CREATE TABLE public.royalty_writers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  royalty_id UUID NOT NULL REFERENCES public.royalty_allocations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  writer_share_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  performance_share NUMERIC(5,2) DEFAULT 0,
  mechanical_share NUMERIC(5,2) DEFAULT 0,
  synchronization_share NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- Q1 2024, Q2 2024, etc.
  period_start DATE,
  period_end DATE,
  gross_royalties NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_payable NUMERIC(10,2) NOT NULL DEFAULT 0,
  royalties_to_date NUMERIC(10,2) NOT NULL DEFAULT 0,
  payments_to_date NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_date DATE,
  payment_method payment_method,
  payment_reference TEXT,
  notes TEXT,
  statement_pdf_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, paid
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payout_royalties junction table to link payouts to specific royalty allocations
CREATE TABLE public.payout_royalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  royalty_id UUID NOT NULL REFERENCES public.royalty_allocations(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_royalties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can manage their own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reconciliation_batches
CREATE POLICY "Users can manage their own reconciliation batches" ON public.reconciliation_batches
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for royalty_allocations
CREATE POLICY "Users can manage their own royalty allocations" ON public.royalty_allocations
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for royalty_writers
CREATE POLICY "Users can manage writers for their royalty allocations" ON public.royalty_writers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.royalty_allocations 
    WHERE royalty_allocations.id = royalty_writers.royalty_id 
    AND royalty_allocations.user_id = auth.uid()
  ));

-- Create RLS policies for payouts
CREATE POLICY "Users can manage their own payouts" ON public.payouts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payout_royalties
CREATE POLICY "Users can manage payout royalties for their payouts" ON public.payout_royalties
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.payouts 
    WHERE payouts.id = payout_royalties.payout_id 
    AND payouts.user_id = auth.uid()
  ));

-- Create function to generate batch IDs
CREATE OR REPLACE FUNCTION public.generate_batch_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    batch_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        batch_id := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.reconciliation_batches WHERE batch_id = batch_id) THEN
            RETURN batch_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger to set batch_id automatically
CREATE OR REPLACE FUNCTION public.set_batch_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.batch_id IS NULL OR NEW.batch_id = '' THEN
        NEW.batch_id := public.generate_batch_id();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_batch_id_trigger
    BEFORE INSERT ON public.reconciliation_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.set_batch_id();

-- Create function to generate work IDs for royalty allocations
CREATE OR REPLACE FUNCTION public.generate_royalty_work_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    work_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        work_id := 'ROY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalty_allocations WHERE work_id = work_id) THEN
            RETURN work_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger to set work_id automatically for royalty allocations
CREATE OR REPLACE FUNCTION public.set_royalty_work_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.work_id IS NULL OR NEW.work_id = '' THEN
        NEW.work_id := public.generate_royalty_work_id();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_royalty_work_id_trigger
    BEFORE INSERT ON public.royalty_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_royalty_work_id();

-- Create updated_at triggers for all tables
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reconciliation_batches_updated_at
    BEFORE UPDATE ON public.reconciliation_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_royalty_allocations_updated_at
    BEFORE UPDATE ON public.royalty_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();