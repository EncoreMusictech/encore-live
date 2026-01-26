-- Make user_id nullable for anonymous catalog discovery in song_metadata_cache
ALTER TABLE public.song_metadata_cache 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow anonymous inserts
DROP POLICY IF EXISTS "Users can insert their own metadata" ON public.song_metadata_cache;
DROP POLICY IF EXISTS "Users can insert metadata cache" ON public.song_metadata_cache;

CREATE POLICY "Anyone can insert song metadata cache" 
ON public.song_metadata_cache 
FOR INSERT 
WITH CHECK (true);

-- Keep select policy allowing users to see their own OR anonymous metadata
DROP POLICY IF EXISTS "Users can view their own metadata" ON public.song_metadata_cache;
DROP POLICY IF EXISTS "Users can view metadata cache" ON public.song_metadata_cache;

CREATE POLICY "Users can view song metadata cache" 
ON public.song_metadata_cache 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow updates on anonymous or own metadata
DROP POLICY IF EXISTS "Users can update their own metadata" ON public.song_metadata_cache;
DROP POLICY IF EXISTS "Users can update metadata cache" ON public.song_metadata_cache;

CREATE POLICY "Users can update song metadata cache" 
ON public.song_metadata_cache 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);