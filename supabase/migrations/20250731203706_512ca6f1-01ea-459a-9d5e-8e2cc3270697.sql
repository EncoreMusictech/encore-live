-- Add RLS policies for sync_licenses table
CREATE POLICY "Users can manage their own sync licenses" 
ON public.sync_licenses 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for sync_invoices table if they don't exist
CREATE POLICY "Users can manage their own sync invoices" 
ON public.sync_invoices 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);