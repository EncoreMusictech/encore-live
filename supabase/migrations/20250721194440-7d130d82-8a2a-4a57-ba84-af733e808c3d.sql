-- Make contract-documents bucket public so edge functions can access files
UPDATE storage.buckets 
SET public = true 
WHERE id = 'contract-documents';

-- Create policy to allow public read access to contract documents
CREATE POLICY "Allow public read access to contract documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contract-documents');