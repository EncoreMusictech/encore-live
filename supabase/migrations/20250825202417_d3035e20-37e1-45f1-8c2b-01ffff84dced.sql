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
ALTER TABLE public.blockchain_admin_settings ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Insert default blockchain admin settings
INSERT INTO public.blockchain_admin_settings (setting_key, setting_value, description) 
VALUES
('gas_fee_limits', '{"max_gwei": 100, "warning_threshold": 50}', 'Gas fee limits and warnings'),
('supported_networks', '["polygon", "ethereum", "binance"]', 'Supported blockchain networks'),  
('contract_templates', '{"royalty_split": {"fee": 0.025}, "escrow": {"fee": 0.01}}', 'Smart contract template settings'),
('marketplace_settings', '{"commission_rate": 0.025, "min_listing_price": 0.001}', 'NFT marketplace configuration')
ON CONFLICT (setting_key) DO NOTHING;