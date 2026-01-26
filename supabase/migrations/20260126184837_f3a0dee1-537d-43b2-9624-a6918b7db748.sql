-- Create catalog_audit_presentations table for tracking marketing presentations
CREATE TABLE public.catalog_audit_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  search_id UUID REFERENCES public.song_catalog_searches(id) ON DELETE SET NULL,
  presentation_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_presented_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_audit_presentations ENABLE ROW LEVEL SECURITY;

-- RLS policies for catalog_audit_presentations
CREATE POLICY "Users can view their own presentations"
ON public.catalog_audit_presentations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations"
ON public.catalog_audit_presentations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations"
ON public.catalog_audit_presentations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
ON public.catalog_audit_presentations
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_catalog_audit_presentations_user_id ON public.catalog_audit_presentations(user_id);
CREATE INDEX idx_catalog_audit_presentations_search_id ON public.catalog_audit_presentations(search_id);

-- Add trigger for updated_at
CREATE TRIGGER update_catalog_audit_presentations_updated_at
BEFORE UPDATE ON public.catalog_audit_presentations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();