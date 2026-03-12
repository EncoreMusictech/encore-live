UPDATE public.original_publishers 
SET publisher_name = REPLACE(publisher_name, ' Publishing Designee', '')
WHERE publisher_name LIKE '% Publishing Designee'