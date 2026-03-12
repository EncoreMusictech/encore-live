
-- Delete all payees created under the Myind Sound service account
DELETE FROM public.payees 
WHERE user_id = '2b73400f-8701-40d1-bc98-aa64f8c603c8';

-- Delete all writers created under the Myind Sound service account for the BDT publisher
DELETE FROM public.writers 
WHERE user_id = '2b73400f-8701-40d1-bc98-aa64f8c603c8'
AND original_publisher_id = '7ee76c4b-6121-4456-bc72-bf65a5306c0c';

-- Delete the auto-generated original publisher
DELETE FROM public.original_publishers 
WHERE id = '7ee76c4b-6121-4456-bc72-bf65a5306c0c'
AND user_id = '2b73400f-8701-40d1-bc98-aa64f8c603c8';
