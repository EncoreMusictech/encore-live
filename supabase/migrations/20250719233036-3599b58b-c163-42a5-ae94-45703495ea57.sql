-- Create song matching history table to persist match data across sessions
CREATE TABLE public.song_match_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  artist_name TEXT,
  copyright_id UUID,
  match_confidence NUMERIC DEFAULT 1.0,
  match_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto', 'exact', 'partial'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_source_song UNIQUE (user_id, source_name, song_title, artist_name)
);

-- Enable RLS on song_match_history
ALTER TABLE public.song_match_history ENABLE ROW LEVEL SECURITY;

-- Create policies for song_match_history
CREATE POLICY "Users can manage their own song match history" 
ON public.song_match_history 
FOR ALL 
USING (auth.uid() = user_id);

-- Add foreign key constraint to copyrights
ALTER TABLE public.song_match_history 
ADD CONSTRAINT song_match_history_copyright_id_fkey 
FOREIGN KEY (copyright_id) REFERENCES public.copyrights(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_song_match_history_user_source ON public.song_match_history(user_id, source_name);
CREATE INDEX idx_song_match_history_song_title ON public.song_match_history(song_title);

-- Add trigger for updated_at
CREATE TRIGGER update_song_match_history_updated_at
BEFORE UPDATE ON public.song_match_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();