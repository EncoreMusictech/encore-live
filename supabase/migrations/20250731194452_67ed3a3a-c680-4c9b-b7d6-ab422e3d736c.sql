-- Create RLS policies for sync_licenses table if they don't exist
-- First enable RLS on the table
ALTER TABLE public.sync_licenses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own sync licenses
DROP POLICY IF EXISTS "Users can view their own sync licenses" ON public.sync_licenses;
CREATE POLICY "Users can view their own sync licenses" 
ON public.sync_licenses FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to create their own sync licenses
DROP POLICY IF EXISTS "Users can create their own sync licenses" ON public.sync_licenses;
CREATE POLICY "Users can create their own sync licenses" 
ON public.sync_licenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own sync licenses
DROP POLICY IF EXISTS "Users can update their own sync licenses" ON public.sync_licenses;
CREATE POLICY "Users can update their own sync licenses" 
ON public.sync_licenses FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for users to delete their own sync licenses
DROP POLICY IF EXISTS "Users can delete their own sync licenses" ON public.sync_licenses;
CREATE POLICY "Users can delete their own sync licenses" 
ON public.sync_licenses FOR DELETE 
USING (auth.uid() = user_id);