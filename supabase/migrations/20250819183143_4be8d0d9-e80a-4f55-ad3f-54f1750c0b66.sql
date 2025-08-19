-- Add 'payee' to the client_data_associations data_type check constraint
ALTER TABLE public.client_data_associations 
DROP CONSTRAINT client_data_associations_data_type_check;

ALTER TABLE public.client_data_associations 
ADD CONSTRAINT client_data_associations_data_type_check 
CHECK (data_type = ANY (ARRAY['copyright'::text, 'contract'::text, 'royalty_allocation'::text, 'sync_license'::text, 'payee'::text, 'contact'::text]));

-- Create RLS policy for clients to view assigned payees
CREATE POLICY "Clients can view assigned payees" 
ON public.payees 
FOR SELECT 
USING (
  has_client_portal_access(auth.uid(), 'royalties') AND 
  EXISTS (
    SELECT 1 FROM public.client_data_associations cda 
    WHERE cda.client_user_id = auth.uid() 
    AND cda.data_type = 'payee' 
    AND cda.data_id = payees.id
  )
);