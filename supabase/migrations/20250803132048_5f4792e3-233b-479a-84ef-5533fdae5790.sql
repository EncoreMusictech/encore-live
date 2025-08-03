-- Create tables for Song Estimator Tool

-- Song catalog searches table
CREATE TABLE public.song_catalog_searches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    songwriter_name TEXT NOT NULL,
    search_status TEXT NOT NULL DEFAULT 'pending',
    total_songs_found INTEGER DEFAULT 0,
    metadata_complete_count INTEGER DEFAULT 0,
    pipeline_estimate_total NUMERIC DEFAULT 0,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    search_parameters JSONB DEFAULT '{}',
    ai_research_summary JSONB DEFAULT '{}'
);

-- Songwriter profiles table
CREATE TABLE public.songwriter_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    songwriter_name TEXT NOT NULL,
    known_aliases TEXT[],
    pro_affiliations JSONB DEFAULT '{}',
    estimated_catalog_size INTEGER,
    primary_genres TEXT[],
    career_period_start DATE,
    career_period_end DATE,
    verified_writer_codes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ai_profile_summary TEXT,
    confidence_score NUMERIC DEFAULT 0
);

-- Song metadata cache table
CREATE TABLE public.song_metadata_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    search_id UUID NOT NULL REFERENCES public.song_catalog_searches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    song_title TEXT NOT NULL,
    songwriter_name TEXT NOT NULL,
    co_writers TEXT[],
    publishers JSONB DEFAULT '{}',
    pro_registrations JSONB DEFAULT '{}',
    iswc TEXT,
    estimated_splits JSONB DEFAULT '{}',
    registration_gaps TEXT[],
    metadata_completeness_score NUMERIC DEFAULT 0,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    source_data JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'unverified'
);

-- Royalty pipeline estimates table
CREATE TABLE public.royalty_pipeline_estimates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    song_metadata_id UUID NOT NULL REFERENCES public.song_metadata_cache(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    estimate_type TEXT NOT NULL, -- 'performance', 'mechanical', 'sync', 'total'
    annual_estimate NUMERIC DEFAULT 0,
    confidence_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    calculation_method TEXT,
    factors_considered JSONB DEFAULT '{}',
    missing_registrations_impact NUMERIC DEFAULT 0,
    potential_upside NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    calculation_details JSONB DEFAULT '{}'
);

-- AI research sessions table
CREATE TABLE public.ai_research_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    search_id UUID NOT NULL REFERENCES public.song_catalog_searches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    session_type TEXT NOT NULL, -- 'initial_search', 'metadata_enhancement', 'pipeline_analysis'
    research_query TEXT NOT NULL,
    ai_response JSONB DEFAULT '{}',
    sources_checked TEXT[],
    findings_summary TEXT,
    confidence_assessment NUMERIC DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    session_status TEXT DEFAULT 'completed'
);

-- Enable RLS on all tables
ALTER TABLE public.song_catalog_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songwriter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_metadata_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_pipeline_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_research_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own catalog searches" 
ON public.song_catalog_searches 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own songwriter profiles" 
ON public.songwriter_profiles 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own song metadata" 
ON public.song_metadata_cache 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pipeline estimates" 
ON public.royalty_pipeline_estimates 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI research sessions" 
ON public.ai_research_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_song_catalog_searches_user_id ON public.song_catalog_searches(user_id);
CREATE INDEX idx_song_catalog_searches_status ON public.song_catalog_searches(search_status);
CREATE INDEX idx_songwriter_profiles_user_id ON public.songwriter_profiles(user_id);
CREATE INDEX idx_songwriter_profiles_name ON public.songwriter_profiles(songwriter_name);
CREATE INDEX idx_song_metadata_search_id ON public.song_metadata_cache(search_id);
CREATE INDEX idx_song_metadata_user_id ON public.song_metadata_cache(user_id);
CREATE INDEX idx_pipeline_estimates_song_id ON public.royalty_pipeline_estimates(song_metadata_id);
CREATE INDEX idx_ai_research_search_id ON public.ai_research_sessions(search_id);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_song_estimator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_song_catalog_searches_updated_at
    BEFORE UPDATE ON public.song_catalog_searches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_song_estimator_updated_at();

CREATE TRIGGER update_songwriter_profiles_updated_at
    BEFORE UPDATE ON public.songwriter_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_song_estimator_updated_at();

CREATE TRIGGER update_song_metadata_cache_updated_at
    BEFORE UPDATE ON public.song_metadata_cache
    FOR EACH ROW
    EXECUTE FUNCTION public.update_song_estimator_updated_at();

CREATE TRIGGER update_royalty_pipeline_estimates_updated_at
    BEFORE UPDATE ON public.royalty_pipeline_estimates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_song_estimator_updated_at();