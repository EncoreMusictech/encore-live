-- Make user_id nullable for anonymous catalog discovery
ALTER TABLE public.song_catalog_searches 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow anonymous inserts for catalog discovery
DROP POLICY IF EXISTS "Users can insert their own searches" ON public.song_catalog_searches;

CREATE POLICY "Anyone can insert catalog searches" 
ON public.song_catalog_searches 
FOR INSERT 
WITH CHECK (true);

-- Keep select policy allowing users to see their own OR anonymous searches
DROP POLICY IF EXISTS "Users can view their own searches" ON public.song_catalog_searches;

CREATE POLICY "Users can view searches" 
ON public.song_catalog_searches 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow updates on anonymous searches or own searches
DROP POLICY IF EXISTS "Users can update their own searches" ON public.song_catalog_searches;

CREATE POLICY "Users can update searches" 
ON public.song_catalog_searches 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);