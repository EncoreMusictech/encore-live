-- Enrichment history tracking table
CREATE TABLE public.enrichment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copyright_id UUID REFERENCES public.copyrights(id) ON DELETE CASCADE,
  enriched_at TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('MLC', 'ASCAP', 'BMI', 'Manual', 'Other')),
  search_params JSONB,
  data_added JSONB,
  confidence NUMERIC(5,2),
  writers_found INTEGER DEFAULT 0,
  publishers_found INTEGER DEFAULT 0,
  recordings_found INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add MLC-specific columns to copyrights if missing
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mlc_work_id TEXT;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mlc_song_code TEXT;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mlc_confidence NUMERIC(5,2);
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mlc_enriched_at TIMESTAMPTZ;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mlc_source TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrichment_history_copyright_id ON public.enrichment_history(copyright_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_history_user_id ON public.enrichment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_history_source ON public.enrichment_history(source);
CREATE INDEX IF NOT EXISTS idx_copyrights_mlc_work_id ON public.copyrights(mlc_work_id) WHERE mlc_work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_copyrights_mlc_song_code ON public.copyrights(mlc_song_code) WHERE mlc_song_code IS NOT NULL;

-- Enable RLS
ALTER TABLE public.enrichment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrichment_history
CREATE POLICY "Users can view their own enrichment history"
ON public.enrichment_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create enrichment history entries"
ON public.enrichment_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrichment history"
ON public.enrichment_history
FOR DELETE
USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE public.enrichment_history IS 'Tracks MLC and other metadata enrichment operations on copyrights';