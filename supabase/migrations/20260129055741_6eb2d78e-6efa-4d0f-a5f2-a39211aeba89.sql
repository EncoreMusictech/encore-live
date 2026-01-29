-- Enable RLS on artist_discography table
ALTER TABLE public.artist_discography ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read artist discography data
CREATE POLICY "Authenticated users can read artist discography"
ON public.artist_discography
FOR SELECT
TO authenticated
USING (true);

-- Allow the edge function (service role) and authenticated users to insert/update cached data
CREATE POLICY "Service and authenticated users can insert artist discography"
ON public.artist_discography
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Service and authenticated users can update artist discography"
ON public.artist_discography
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);