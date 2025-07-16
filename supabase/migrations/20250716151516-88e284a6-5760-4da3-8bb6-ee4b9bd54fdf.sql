-- Enhanced Contract Module with Interested Parties Integration

-- Add new fields to contracts table for comprehensive agreement setup
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS agreement_id TEXT UNIQUE DEFAULT ('AGR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(EXTRACT(epoch FROM now())::text, 8, '0')),
ADD COLUMN IF NOT EXISTS original_publisher TEXT,
ADD COLUMN IF NOT EXISTS administrator TEXT,
ADD COLUMN IF NOT EXISTS territories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS distribution_cycle TEXT DEFAULT 'quarterly',
ADD COLUMN IF NOT EXISTS statement_delivery TEXT DEFAULT 'combined',
ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rate_reduction_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rate_reduction_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fe_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS w9_url TEXT,
ADD COLUMN IF NOT EXISTS direct_deposit_auth_url TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_address TEXT,
ADD COLUMN IF NOT EXISTS recoupment_status TEXT DEFAULT 'unrecouped',
ADD COLUMN IF NOT EXISTS controlled_percentage NUMERIC DEFAULT 0;

-- Create Interested Parties table (replaces writers table concept)
CREATE TABLE IF NOT EXISTS public.contract_interested_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  name TEXT NOT NULL,
  dba_alias TEXT,
  party_type TEXT NOT NULL DEFAULT 'writer', -- writer, producer, publisher, administrator, co_publisher, label, etc.
  controlled_status TEXT NOT NULL DEFAULT 'NC', -- 'C' for Controlled, 'NC' for Non-Controlled
  cae_number TEXT,
  ipi_number TEXT,
  affiliation TEXT, -- ASCAP, BMI, SESAC, etc.
  
  -- Royalty splits by right type (all should total 100% per type across all parties)
  performance_percentage NUMERIC DEFAULT 0,
  mechanical_percentage NUMERIC DEFAULT 0,
  print_percentage NUMERIC DEFAULT 0,
  synch_percentage NUMERIC DEFAULT 0,
  grand_rights_percentage NUMERIC DEFAULT 0,
  karaoke_percentage NUMERIC DEFAULT 0,
  
  -- Publishing roles
  original_publisher TEXT,
  administrator_role TEXT,
  co_publisher TEXT,
  
  -- Contact and legal info
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Schedule of Works table (links works to contracts)
CREATE TABLE IF NOT EXISTS public.contract_schedule_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  copyright_id UUID, -- Links to copyrights table
  work_id TEXT, -- Alternative work identifier
  song_title TEXT NOT NULL,
  artist_name TEXT,
  album_title TEXT,
  isrc TEXT,
  iswc TEXT,
  
  -- Inheritance flags from contract
  inherits_royalty_splits BOOLEAN DEFAULT true,
  inherits_recoupment_status BOOLEAN DEFAULT true,
  inherits_controlled_status BOOLEAN DEFAULT true,
  
  -- Work-specific overrides
  work_specific_advance NUMERIC DEFAULT 0,
  work_specific_rate_reduction NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contract_interested_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_schedule_works ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interested parties
CREATE POLICY "Users can manage interested parties for their contracts"
ON public.contract_interested_parties
FOR ALL
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_interested_parties.contract_id 
  AND contracts.user_id = auth.uid()
));

-- Create RLS policies for schedule of works
CREATE POLICY "Users can manage schedule of works for their contracts"
ON public.contract_schedule_works
FOR ALL
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_schedule_works.contract_id 
  AND contracts.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.contract_interested_parties
ADD CONSTRAINT contract_interested_parties_contract_id_fkey
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_schedule_works
ADD CONSTRAINT contract_schedule_works_contract_id_fkey
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Optional foreign key to copyrights table
ALTER TABLE public.contract_schedule_works
ADD CONSTRAINT contract_schedule_works_copyright_id_fkey
FOREIGN KEY (copyright_id) REFERENCES public.copyrights(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_contract_interested_parties_contract_id ON public.contract_interested_parties(contract_id);
CREATE INDEX idx_contract_interested_parties_party_type ON public.contract_interested_parties(party_type);
CREATE INDEX idx_contract_interested_parties_controlled_status ON public.contract_interested_parties(controlled_status);
CREATE INDEX idx_contract_schedule_works_contract_id ON public.contract_schedule_works(contract_id);
CREATE INDEX idx_contract_schedule_works_copyright_id ON public.contract_schedule_works(copyright_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_contract_interested_parties_updated_at
BEFORE UPDATE ON public.contract_interested_parties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_schedule_works_updated_at
BEFORE UPDATE ON public.contract_schedule_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate controlled percentage for a contract
CREATE OR REPLACE FUNCTION public.calculate_contract_controlled_percentage(contract_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total_controlled NUMERIC;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN controlled_status = 'C' THEN 
                GREATEST(performance_percentage, mechanical_percentage, synch_percentage)
            ELSE 0 
        END
    ), 0)
    INTO total_controlled
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
    
    RETURN total_controlled;
END;
$$;

-- Create trigger to update controlled percentage when interested parties change
CREATE OR REPLACE FUNCTION public.update_contract_controlled_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    contract_controlled_pct NUMERIC;
BEGIN
    -- Calculate the new controlled percentage
    contract_controlled_pct := public.calculate_contract_controlled_percentage(
        COALESCE(NEW.contract_id, OLD.contract_id)
    );
    
    -- Update the contract record
    UPDATE public.contracts
    SET controlled_percentage = contract_controlled_pct,
        updated_at = now()
    WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update controlled percentage
CREATE TRIGGER update_contract_controlled_percentage_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contract_interested_parties
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_controlled_percentage();

-- Create validation function for royalty splits
CREATE OR REPLACE FUNCTION public.validate_royalty_splits(contract_id_param UUID)
RETURNS TABLE (
    right_type TEXT,
    total_percentage NUMERIC,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'performance' as right_type,
        COALESCE(SUM(performance_percentage), 0) as total_percentage,
        COALESCE(SUM(performance_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'mechanical' as right_type,
        COALESCE(SUM(mechanical_percentage), 0) as total_percentage,
        COALESCE(SUM(mechanical_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'synch' as right_type,
        COALESCE(SUM(synch_percentage), 0) as total_percentage,
        COALESCE(SUM(synch_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'print' as right_type,
        COALESCE(SUM(print_percentage), 0) as total_percentage,
        COALESCE(SUM(print_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'grand_rights' as right_type,
        COALESCE(SUM(grand_rights_percentage), 0) as total_percentage,
        COALESCE(SUM(grand_rights_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'karaoke' as right_type,
        COALESCE(SUM(karaoke_percentage), 0) as total_percentage,
        COALESCE(SUM(karaoke_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
END;
$$;