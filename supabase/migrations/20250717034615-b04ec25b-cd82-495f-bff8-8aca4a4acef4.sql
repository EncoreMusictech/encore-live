-- Create client roles enum
CREATE TYPE public.client_role AS ENUM ('admin', 'client');

-- Create client portal access table
CREATE TABLE public.client_portal_access (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_user_id uuid NOT NULL, -- The ENCORE subscriber who owns the portal
    client_user_id uuid NOT NULL, -- The client user who gets access
    role client_role NOT NULL DEFAULT 'client',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    permissions jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    UNIQUE(subscriber_user_id, client_user_id)
);

-- Create client invitations table
CREATE TABLE public.client_invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_user_id uuid NOT NULL,
    email text NOT NULL,
    role client_role NOT NULL DEFAULT 'client',
    permissions jsonb NOT NULL DEFAULT '{}',
    invitation_token text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    accepted_at timestamp with time zone,
    accepted_by_user_id uuid
);

-- Create client data associations table (links clients to their works/contracts/etc)
CREATE TABLE public.client_data_associations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_user_id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    data_type text NOT NULL CHECK (data_type IN ('copyright', 'contract', 'royalty_allocation', 'sync_license')),
    data_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(subscriber_user_id, client_user_id, data_type, data_id)
);

-- Enable RLS on all tables
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_data_associations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_portal_access
CREATE POLICY "Subscribers can manage their client access"
ON public.client_portal_access
FOR ALL
USING (auth.uid() = subscriber_user_id);

CREATE POLICY "Clients can view their own access"
ON public.client_portal_access
FOR SELECT
USING (auth.uid() = client_user_id);

-- RLS Policies for client_invitations  
CREATE POLICY "Subscribers can manage their invitations"
ON public.client_invitations
FOR ALL
USING (auth.uid() = subscriber_user_id);

-- RLS Policies for client_data_associations
CREATE POLICY "Subscribers can manage their client data associations"
ON public.client_data_associations
FOR ALL
USING (auth.uid() = subscriber_user_id);

CREATE POLICY "Clients can view their data associations"
ON public.client_data_associations
FOR SELECT
USING (auth.uid() = client_user_id);

-- Create function to check if user has client portal access
CREATE OR REPLACE FUNCTION public.has_client_portal_access(
    _user_id uuid,
    _module text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.client_portal_access 
        WHERE client_user_id = _user_id 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
        AND CASE 
            WHEN _module IS NULL THEN true
            ELSE (permissions->_module->>'enabled')::boolean = true
        END
    );
$$;

-- Create function to get client's subscriber
CREATE OR REPLACE FUNCTION public.get_client_subscriber(_client_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT subscriber_user_id 
    FROM public.client_portal_access 
    WHERE client_user_id = _client_user_id 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    token text;
BEGIN
    token := encode(gen_random_bytes(32), 'base64');
    -- Remove URL-unsafe characters
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    RETURN token;
END;
$$;

-- Create trigger to auto-generate invitation tokens
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.invitation_token IS NULL OR NEW.invitation_token = '' THEN
        NEW.invitation_token := public.generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_client_invitation_token
    BEFORE INSERT ON public.client_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invitation_token();

-- Add updated_at trigger for client_portal_access
CREATE TRIGGER update_client_portal_access_updated_at
    BEFORE UPDATE ON public.client_portal_access
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add client portal permissions to existing tables via RLS policies

-- Enhanced RLS for copyrights to include client access
CREATE POLICY "Clients can view assigned copyrights"
ON public.copyrights
FOR SELECT
USING (
    public.has_client_portal_access(auth.uid(), 'copyright') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid()
        AND cda.data_type = 'copyright'
        AND cda.data_id = copyrights.id
    )
);

-- Enhanced RLS for contracts to include client access
CREATE POLICY "Clients can view assigned contracts"
ON public.contracts
FOR SELECT
USING (
    public.has_client_portal_access(auth.uid(), 'contracts') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid()
        AND cda.data_type = 'contract'
        AND cda.data_id = contracts.id
    )
);

-- Enhanced RLS for royalty_allocations to include client access
CREATE POLICY "Clients can view assigned royalty allocations"
ON public.royalty_allocations
FOR SELECT
USING (
    public.has_client_portal_access(auth.uid(), 'royalties') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid()
        AND cda.data_type = 'royalty_allocation'
        AND cda.data_id = royalty_allocations.id
    )
);

-- Enhanced RLS for sync_licenses to include client access
CREATE POLICY "Clients can view assigned sync licenses"
ON public.sync_licenses
FOR SELECT
USING (
    public.has_client_portal_access(auth.uid(), 'sync-licensing') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid()
        AND cda.data_type = 'sync_license'
        AND cda.data_id = sync_licenses.id
    )
);

-- Create indexes for performance
CREATE INDEX idx_client_portal_access_client_user_id ON public.client_portal_access(client_user_id);
CREATE INDEX idx_client_portal_access_subscriber_user_id ON public.client_portal_access(subscriber_user_id);
CREATE INDEX idx_client_invitations_token ON public.client_invitations(invitation_token);
CREATE INDEX idx_client_invitations_email ON public.client_invitations(email);
CREATE INDEX idx_client_data_associations_client_user_id ON public.client_data_associations(client_user_id);
CREATE INDEX idx_client_data_associations_data_type_id ON public.client_data_associations(data_type, data_id);