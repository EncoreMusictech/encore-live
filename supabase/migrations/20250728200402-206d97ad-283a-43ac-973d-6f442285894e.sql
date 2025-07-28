-- Create catalog_revenue_sources table for additional revenue data
CREATE TABLE public.catalog_revenue_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_valuation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('streaming', 'sync', 'performance', 'mechanical', 'merchandise', 'touring', 'publishing', 'master_licensing', 'other')),
  revenue_source TEXT NOT NULL, -- e.g., "Netflix Sync Deal", "Spotify Streaming", "Live Performances"
  annual_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  growth_rate NUMERIC(5,2) DEFAULT 0, -- Annual growth rate percentage
  confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  start_date DATE,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT true,
  notes TEXT,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_revenue_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own revenue sources"
ON public.catalog_revenue_sources
FOR ALL
USING (auth.uid() = user_id);

-- Add foreign key relationship
ALTER TABLE public.catalog_revenue_sources
ADD CONSTRAINT fk_catalog_valuation 
FOREIGN KEY (catalog_valuation_id) 
REFERENCES public.catalog_valuations(id) 
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_catalog_revenue_sources_valuation_id ON public.catalog_revenue_sources(catalog_valuation_id);
CREATE INDEX idx_catalog_revenue_sources_user_id ON public.catalog_revenue_sources(user_id);

-- Enhance catalog_valuations table with additional fields
ALTER TABLE public.catalog_valuations 
ADD COLUMN IF NOT EXISTS has_additional_revenue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_additional_revenue NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS blended_valuation NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS revenue_diversification_score NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valuation_methodology_v2 TEXT DEFAULT 'basic';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_catalog_revenue_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_revenue_sources_updated_at
    BEFORE UPDATE ON public.catalog_revenue_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_catalog_revenue_sources_updated_at();