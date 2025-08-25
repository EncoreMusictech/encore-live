-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user has role
CREATE OR REPLACE FUNCTION public.has_current_user_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create table for blockchain admin settings
CREATE TABLE public.blockchain_admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for admin settings
ALTER TABLE public.blockchain_admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access blockchain admin settings
CREATE POLICY "Only admins can access blockchain settings"
ON public.blockchain_admin_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default blockchain admin settings
INSERT INTO public.blockchain_admin_settings (setting_key, setting_value, description) VALUES
('gas_fee_limits', '{"max_gwei": 100, "warning_threshold": 50}', 'Gas fee limits and warnings'),
('supported_networks', '["polygon", "ethereum", "binance"]', 'Supported blockchain networks'),
('contract_templates', '{"royalty_split": {"fee": 0.025}, "escrow": {"fee": 0.01}}', 'Smart contract template settings'),
('marketplace_settings', '{"commission_rate": 0.025, "min_listing_price": 0.001}', 'NFT marketplace configuration');

-- Create table for blockchain transactions monitoring
CREATE TABLE public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_hash TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'polygon',
    status TEXT NOT NULL DEFAULT 'pending',
    gas_used BIGINT,
    gas_price BIGINT,
    value_eth DECIMAL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for blockchain transactions
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own blockchain transactions"
ON public.blockchain_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert transactions
CREATE POLICY "System can insert blockchain transactions"
ON public.blockchain_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins can view all blockchain transactions"
ON public.blockchain_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));