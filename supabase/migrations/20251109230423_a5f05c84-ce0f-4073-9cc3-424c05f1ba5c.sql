-- Enable RLS policies for copyright_writers table
-- This allows authenticated users to access copyright writers data

-- Policy for SELECT - Users can view writers for their own copyrights
CREATE POLICY "Users can view their own copyright writers"
ON public.copyright_writers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.copyrights
    WHERE copyrights.id = copyright_writers.copyright_id
    AND copyrights.user_id = auth.uid()
  )
);

-- Policy for INSERT - Users can add writers to their own copyrights
CREATE POLICY "Users can add writers to their own copyrights"
ON public.copyright_writers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.copyrights
    WHERE copyrights.id = copyright_writers.copyright_id
    AND copyrights.user_id = auth.uid()
  )
);

-- Policy for UPDATE - Users can update writers on their own copyrights
CREATE POLICY "Users can update writers on their own copyrights"
ON public.copyright_writers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.copyrights
    WHERE copyrights.id = copyright_writers.copyright_id
    AND copyrights.user_id = auth.uid()
  )
);

-- Policy for DELETE - Users can delete writers from their own copyrights
CREATE POLICY "Users can delete writers from their own copyrights"
ON public.copyright_writers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.copyrights
    WHERE copyrights.id = copyright_writers.copyright_id
    AND copyrights.user_id = auth.uid()
  )
);