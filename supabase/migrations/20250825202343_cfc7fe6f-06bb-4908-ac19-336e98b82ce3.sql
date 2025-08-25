-- Check if app_role enum exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END
$$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'user_roles' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create or replace the has_role function
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

-- Create or replace function to check if current user has role
CREATE OR REPLACE FUNCTION public.has_current_user_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'Users can view their own roles'
    ) THEN
        CREATE POLICY "Users can view their own roles"
        ON public.user_roles
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'Admins can manage all roles'
    ) THEN
        CREATE POLICY "Admins can manage all roles"
        ON public.user_roles
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'))
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Create table for blockchain admin settings
CREATE TABLE IF NOT EXISTS public.blockchain_admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for admin settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'blockchain_admin_settings' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.blockchain_admin_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policy for blockchain admin settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'Only admins can access blockchain settings'
    ) THEN
        CREATE POLICY "Only admins can access blockchain settings"
        ON public.blockchain_admin_settings
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'))
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Insert default blockchain admin settings if they don't exist
INSERT INTO public.blockchain_admin_settings (setting_key, setting_value, description) 
VALUES
('gas_fee_limits', '{"max_gwei": 100, "warning_threshold": 50}', 'Gas fee limits and warnings'),
('supported_networks', '["polygon", "ethereum", "binance"]', 'Supported blockchain networks'),
('contract_templates', '{"royalty_split": {"fee": 0.025}, "escrow": {"fee": 0.01}}', 'Smart contract template settings'),
('marketplace_settings', '{"commission_rate": 0.025, "min_listing_price": 0.001}', 'NFT marketplace configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- Create table for blockchain transactions monitoring
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'blockchain_transactions' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policies for blockchain transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'Users can view their own blockchain transactions'
    ) THEN
        CREATE POLICY "Users can view their own blockchain transactions"
        ON public.blockchain_transactions
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'System can insert blockchain transactions'
    ) THEN
        CREATE POLICY "System can insert blockchain transactions"
        ON public.blockchain_transactions
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE policyname = 'Admins can view all blockchain transactions'
    ) THEN
        CREATE POLICY "Admins can view all blockchain transactions"
        ON public.blockchain_transactions
        FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;