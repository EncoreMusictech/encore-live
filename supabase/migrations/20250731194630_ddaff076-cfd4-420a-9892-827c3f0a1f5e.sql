-- Check if sync_invoices table exists and add RLS policies
-- First enable RLS on the table
ALTER TABLE public.sync_invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own sync invoices
DROP POLICY IF EXISTS "Users can view their own sync invoices" ON public.sync_invoices;
CREATE POLICY "Users can view their own sync invoices" 
ON public.sync_invoices FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to create their own sync invoices
DROP POLICY IF EXISTS "Users can create their own sync invoices" ON public.sync_invoices;
CREATE POLICY "Users can create their own sync invoices" 
ON public.sync_invoices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own sync invoices
DROP POLICY IF EXISTS "Users can update their own sync invoices" ON public.sync_invoices;
CREATE POLICY "Users can update their own sync invoices" 
ON public.sync_invoices FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for users to delete their own sync invoices
DROP POLICY IF EXISTS "Users can delete their own sync invoices" ON public.sync_invoices;
CREATE POLICY "Users can delete their own sync invoices" 
ON public.sync_invoices FOR DELETE 
USING (auth.uid() = user_id);