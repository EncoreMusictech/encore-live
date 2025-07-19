-- Create storage bucket for MP3 audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);

-- Create RLS policies for audio files bucket
CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Audio files are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);