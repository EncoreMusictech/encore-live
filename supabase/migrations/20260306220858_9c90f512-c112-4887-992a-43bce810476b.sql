-- Make the company-logos bucket public so getPublicUrl works
UPDATE storage.buckets 
SET public = true 
WHERE id = 'company-logos';

-- If bucket doesn't exist yet, create it as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;