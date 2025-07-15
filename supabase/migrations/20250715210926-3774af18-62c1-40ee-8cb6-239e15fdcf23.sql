-- Create royalties import staging table for universal statement ingestion
CREATE TABLE public.royalties_import_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id UUID REFERENCES reconciliation_batches(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  detected_source TEXT NOT NULL, -- e.g., 'BMI', 'ASCAP', 'YouTube'
  mapping_version TEXT NOT NULL DEFAULT '1.0',
  raw_data JSONB NOT NULL, -- Original parsed data
  mapped_data JSONB NOT NULL, -- Mapped to ENCORE format
  validation_status JSONB DEFAULT '{}', -- Validation results
  unmapped_fields TEXT[] DEFAULT '{}', -- Fields that couldn't be mapped
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'needs_review')),
  work_matches JSONB DEFAULT '{}', -- Matched works from catalog
  payee_matches JSONB DEFAULT '{}', -- Matched payees from contacts
  import_tags TEXT[] DEFAULT '{}', -- Tags like 'Unrecouped', 'Needs Review'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.royalties_import_staging ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own import staging records"
ON public.royalties_import_staging
FOR ALL
USING (auth.uid() = user_id);

-- Create source mapping configuration table
CREATE TABLE public.source_mapping_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE, -- e.g., 'BMI', 'ASCAP'
  mapping_rules JSONB NOT NULL, -- Column mappings
  header_patterns TEXT[] DEFAULT '{}', -- Known header patterns for detection
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.source_mapping_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active mapping configs"
ON public.source_mapping_config
FOR SELECT
USING (is_active = true);

CREATE POLICY "System can manage mapping configs"
ON public.source_mapping_config
FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_royalties_import_staging_updated_at
BEFORE UPDATE ON public.royalties_import_staging
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_source_mapping_config_updated_at
BEFORE UPDATE ON public.source_mapping_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();