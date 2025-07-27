-- Create missing contact records for existing writers
INSERT INTO public.contacts (user_id, name, contact_type, created_at, updated_at)
SELECT DISTINCT 
    w.user_id,
    w.writer_name,
    'writer'::text,
    now(),
    now()
FROM public.writers w
WHERE NOT EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.user_id = w.user_id 
    AND c.name = w.writer_name 
    AND c.contact_type = 'writer'
);