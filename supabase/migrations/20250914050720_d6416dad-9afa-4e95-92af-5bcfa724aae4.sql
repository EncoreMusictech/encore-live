-- Create storage bucket for import files
INSERT INTO storage.buckets (id, name, public) VALUES ('import-files', 'import-files', false);

-- Create storage policies for import files
CREATE POLICY "Admins can upload import files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'import-files' AND 
  (auth.email() = 'info@encoremusic.tech' OR auth.email() = 'support@encoremusic.tech')
);

CREATE POLICY "Admins can view import files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'import-files' AND 
  (auth.email() = 'info@encoremusic.tech' OR auth.email() = 'support@encoremusic.tech')
);

CREATE POLICY "Admins can delete import files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'import-files' AND 
  (auth.email() = 'info@encoremusic.tech' OR auth.email() = 'support@encoremusic.tech')
);

-- Fix search path for the new function
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';