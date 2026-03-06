-- Create public bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to update company logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

-- Allow authenticated users to delete company logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');