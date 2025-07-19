-- Create track_tags table for storing audio analysis data
CREATE TABLE public.track_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  
  -- ID3 Metadata
  title TEXT,
  artist TEXT,
  album TEXT,
  year INTEGER,
  genre TEXT,
  duration_seconds INTEGER,
  
  -- AI-analyzed tags
  mood_emotion TEXT[],
  energy_level TEXT,
  genre_subgenre TEXT[],
  scene_use_case TEXT[],
  vocal_type TEXT,
  instrumentation TEXT[],
  structure_tags TEXT[],
  lyrical_themes TEXT[],
  
  -- Analysis metadata
  analysis_status TEXT DEFAULT 'pending',
  analysis_confidence NUMERIC,
  manual_overrides JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.track_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own track tags" 
ON public.track_tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own track tags" 
ON public.track_tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own track tags" 
ON public.track_tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own track tags" 
ON public.track_tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_track_tags_user_id ON public.track_tags(user_id);
CREATE INDEX idx_track_tags_file_url ON public.track_tags(file_url);
CREATE INDEX idx_track_tags_genre ON public.track_tags USING GIN(genre_subgenre);
CREATE INDEX idx_track_tags_mood ON public.track_tags USING GIN(mood_emotion);

-- Create trigger for updated_at
CREATE TRIGGER update_track_tags_updated_at
BEFORE UPDATE ON public.track_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();