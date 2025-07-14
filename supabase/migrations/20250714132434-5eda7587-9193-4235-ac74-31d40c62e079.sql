-- Enhance catalog_valuations table with new columns for advanced valuation
ALTER TABLE public.catalog_valuations 
ADD COLUMN IF NOT EXISTS ltm_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS catalog_age_years INTEGER,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS popularity_score NUMERIC,
ADD COLUMN IF NOT EXISTS discount_rate NUMERIC DEFAULT 0.12,
ADD COLUMN IF NOT EXISTS growth_assumptions JSONB,
ADD COLUMN IF NOT EXISTS dcf_valuation NUMERIC,
ADD COLUMN IF NOT EXISTS multiple_valuation NUMERIC,
ADD COLUMN IF NOT EXISTS risk_adjusted_value NUMERIC,
ADD COLUMN IF NOT EXISTS valuation_methodology TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS comparable_multiples JSONB,
ADD COLUMN IF NOT EXISTS cash_flow_projections JSONB;

-- Create a new table for valuation tiers and permissions
CREATE TABLE IF NOT EXISTS public.valuation_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tier_name TEXT NOT NULL CHECK (tier_name IN ('basic', 'professional', 'enterprise')),
  features_enabled JSONB NOT NULL DEFAULT '{}',
  max_valuations_per_month INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on valuation_tiers
ALTER TABLE public.valuation_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies for valuation_tiers
CREATE POLICY "Users can view their own tier" 
ON public.valuation_tiers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tier" 
ON public.valuation_tiers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tier" 
ON public.valuation_tiers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on valuation_tiers
CREATE TRIGGER update_valuation_tiers_updated_at
BEFORE UPDATE ON public.valuation_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a new table for industry benchmarks and comparable data
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genre TEXT NOT NULL,
  revenue_multiple_min NUMERIC,
  revenue_multiple_max NUMERIC,
  revenue_multiple_avg NUMERIC,
  streams_to_revenue_ratio NUMERIC,
  growth_rate_assumption NUMERIC,
  market_risk_factor NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on industry_benchmarks (public read access)
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view industry benchmarks" 
ON public.industry_benchmarks 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage industry benchmarks" 
ON public.industry_benchmarks 
FOR ALL 
USING (true);

-- Insert sample industry benchmark data
INSERT INTO public.industry_benchmarks (genre, revenue_multiple_min, revenue_multiple_max, revenue_multiple_avg, streams_to_revenue_ratio, growth_rate_assumption, market_risk_factor) VALUES
('pop', 8.0, 15.0, 11.5, 0.003, 0.05, 0.15),
('rock', 7.0, 12.0, 9.5, 0.0025, 0.03, 0.18),
('hip-hop', 10.0, 18.0, 14.0, 0.004, 0.08, 0.12),
('electronic', 6.0, 14.0, 10.0, 0.0035, 0.06, 0.16),
('country', 8.0, 13.0, 10.5, 0.0028, 0.04, 0.17),
('r&b', 9.0, 16.0, 12.5, 0.0038, 0.07, 0.14),
('alternative', 7.0, 13.0, 10.0, 0.003, 0.04, 0.19),
('classical', 5.0, 10.0, 7.5, 0.002, 0.02, 0.25),
('jazz', 4.0, 9.0, 6.5, 0.0018, 0.02, 0.28),
('folk', 5.0, 11.0, 8.0, 0.0022, 0.03, 0.22);

-- Create trigger for automatic timestamp updates on industry_benchmarks
CREATE TRIGGER update_industry_benchmarks_updated_at
BEFORE UPDATE ON public.industry_benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();