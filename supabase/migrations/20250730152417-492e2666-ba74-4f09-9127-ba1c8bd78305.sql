-- Create saved valuation scenarios table
CREATE TABLE public.saved_valuation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    
    -- Core valuation data
    valuation_amount DECIMAL(15,2),
    risk_adjusted_value DECIMAL(15,2),
    dcf_valuation DECIMAL(15,2),
    multiple_valuation DECIMAL(15,2),
    confidence_score INTEGER,
    
    -- Artist metrics
    total_streams BIGINT,
    monthly_listeners INTEGER,
    popularity_score INTEGER,
    
    -- Financial metrics
    ltm_revenue DECIMAL(15,2),
    discount_rate DECIMAL(5,4),
    catalog_age_years INTEGER,
    genre TEXT,
    
    -- Methodology and additional data
    valuation_methodology TEXT,
    has_additional_revenue BOOLEAN DEFAULT FALSE,
    total_additional_revenue DECIMAL(15,2) DEFAULT 0,
    revenue_diversification_score DECIMAL(5,4) DEFAULT 0,
    
    -- JSON data for complex objects
    top_tracks JSONB,
    forecasts JSONB,
    comparable_artists JSONB,
    cash_flow_projections JSONB,
    industry_benchmarks JSONB,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_valuation_scenarios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved scenarios"
    ON public.saved_valuation_scenarios
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved scenarios"
    ON public.saved_valuation_scenarios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved scenarios"
    ON public.saved_valuation_scenarios
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved scenarios"
    ON public.saved_valuation_scenarios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_saved_valuation_scenarios_user_id ON public.saved_valuation_scenarios(user_id);
CREATE INDEX idx_saved_valuation_scenarios_created_at ON public.saved_valuation_scenarios(created_at DESC);
CREATE INDEX idx_saved_valuation_scenarios_artist_name ON public.saved_valuation_scenarios(artist_name);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_saved_valuation_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_valuation_scenarios_updated_at
    BEFORE UPDATE ON public.saved_valuation_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_saved_valuation_scenarios_updated_at();