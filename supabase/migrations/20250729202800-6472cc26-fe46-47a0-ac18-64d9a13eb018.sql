-- Add sound recording certificate attachment field to copyrights table
ALTER TABLE public.copyrights 
ADD COLUMN sound_recording_certificate_url text;