-- Create enum types for contract fields
CREATE TYPE contract_type AS ENUM ('publishing', 'artist', 'producer', 'sync', 'distribution');
CREATE TYPE contract_status AS ENUM ('draft', 'signed', 'active', 'expired', 'terminated');
CREATE TYPE publishing_type AS ENUM ('admin', 'copub', 'full_pub', 'jv');
CREATE TYPE artist_type AS ENUM ('indie', 'label', '360', 'distribution_only');
CREATE TYPE producer_type AS ENUM ('flat_fee', 'points', 'hybrid');
CREATE TYPE sync_type AS ENUM ('one_time', 'mfn', 'perpetual', 'term_limited');

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_type contract_type NOT NULL,
  contract_status contract_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  counterparty_name TEXT NOT NULL,
  
  -- Contract dates
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Financial terms (stored as JSONB for flexibility)
  financial_terms JSONB DEFAULT '{}',
  
  -- Contract-specific data (varies by type)
  contract_data JSONB DEFAULT '{}',
  
  -- Royalty and split information
  royalty_splits JSONB DEFAULT '{}',
  
  -- Associated assets
  associated_catalog_ids UUID[],
  
  -- File attachments
  original_pdf_url TEXT,
  generated_pdf_url TEXT,
  
  -- Metadata
  notes TEXT,
  version INTEGER DEFAULT 1
);

-- Create contract_templates table for reusable templates
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  contract_type contract_type NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract_royalty_connections table to link contracts to royalty processing
CREATE TABLE public.contract_royalty_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  catalog_id UUID,
  royalty_type TEXT NOT NULL, -- 'mechanical', 'performance', 'sync', 'master', etc.
  split_percentage DECIMAL(5,2) NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'writer', 'publisher', 'artist', 'producer', etc.
  payment_priority INTEGER DEFAULT 1,
  recoupment_applicable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_royalty_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts
CREATE POLICY "Users can view their own contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts" 
ON public.contracts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for contract templates
CREATE POLICY "Users can view their own templates and public templates" 
ON public.contract_templates 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own templates" 
ON public.contract_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.contract_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.contract_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for royalty connections
CREATE POLICY "Users can view royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = auth.uid()
));

CREATE POLICY "Users can create royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = auth.uid()
));

CREATE POLICY "Users can update royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = auth.uid()
));

CREATE POLICY "Users can delete royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = auth.uid()
));

-- Create function to update updated_at timestamp
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX idx_contracts_type_status ON public.contracts(contract_type, contract_status);
CREATE INDEX idx_contracts_dates ON public.contracts(start_date, end_date);
CREATE INDEX idx_contract_templates_user_type ON public.contract_templates(user_id, contract_type);
CREATE INDEX idx_royalty_connections_contract ON public.contract_royalty_connections(contract_id);