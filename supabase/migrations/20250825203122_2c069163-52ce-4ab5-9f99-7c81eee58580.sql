-- Create RLS policies for blockchain_admin_settings (admin access only)
CREATE POLICY "Only system admins can access blockchain settings"
ON public.blockchain_admin_settings
FOR ALL  
TO authenticated
USING (auth.email() = 'info@encoremusic.tech')
WITH CHECK (auth.email() = 'info@encoremusic.tech');

-- Create RLS policies for blockchain_transactions  
CREATE POLICY "Users can view their own blockchain transactions"
ON public.blockchain_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own blockchain transactions"
ON public.blockchain_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System admins can view all blockchain transactions"
ON public.blockchain_transactions
FOR SELECT
TO authenticated
USING (auth.email() = 'info@encoremusic.tech');