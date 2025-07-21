-- Create storage bucket for contract uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-documents', 'contract-documents', false);

-- Create storage policies for contract documents
-- Users can view their own uploaded contract documents
CREATE POLICY "Users can view their own contract documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload their own contract documents
CREATE POLICY "Users can upload their own contract documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own contract documents
CREATE POLICY "Users can update their own contract documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own contract documents
CREATE POLICY "Users can delete their own contract documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);