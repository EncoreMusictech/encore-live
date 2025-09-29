-- Create deal_historical_statements table
CREATE TABLE public.deal_historical_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Artist/Catalog Association
  artist_name TEXT NOT NULL,
  artist_id TEXT,
  catalog_name TEXT,
  
  -- Period Information
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  period_label TEXT NOT NULL,
  
  -- Statement Type
  statement_type TEXT NOT NULL CHECK (statement_type IN ('recording', 'publishing', 'both')),
  
  -- Revenue Data
  gross_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  streams BIGINT,
  
  -- Detailed Breakdown
  mechanical_royalties NUMERIC(15,2) DEFAULT 0,
  performance_royalties NUMERIC(15,2) DEFAULT 0,
  sync_revenue NUMERIC(15,2) DEFAULT 0,
  streaming_revenue NUMERIC(15,2) DEFAULT 0,
  other_revenue NUMERIC(15,2) DEFAULT 0,
  expenses NUMERIC(15,2) DEFAULT 0,
  
  -- Source Breakdown (Spotify, Apple Music, etc.)
  revenue_sources JSONB DEFAULT '{}',
  
  -- Supporting Data
  notes TEXT,
  file_url TEXT,
  source_detected TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, artist_name, year, quarter, statement_type)
);

-- Indexes
CREATE INDEX idx_historical_statements_user ON deal_historical_statements(user_id);
CREATE INDEX idx_historical_statements_artist ON deal_historical_statements(artist_name, user_id);
CREATE INDEX idx_historical_statements_period ON deal_historical_statements(year, quarter);

-- RLS Policies
ALTER TABLE deal_historical_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own historical statements"
ON deal_historical_statements FOR ALL
USING (auth.uid() = user_id);

-- Storage Bucket for Statement Files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deal-statements', 'deal-statements', false);

-- Storage RLS Policies
CREATE POLICY "Users can upload their own statements"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'deal-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own statements"
ON storage.objects FOR SELECT
USING (bucket_id = 'deal-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own statements"
ON storage.objects FOR DELETE
USING (bucket_id = 'deal-statements' AND auth.uid()::text = (storage.foldername(name))[1]);