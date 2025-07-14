-- Create sync licensing tracker table
CREATE TABLE public.sync_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  synch_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Incoming Sync Request
  project_title TEXT NOT NULL,
  synch_agent TEXT,
  media_type TEXT CHECK (media_type IN ('Film', 'TV', 'Ad', 'Social', 'Game', 'Other')),
  request_received DATE,
  request_attachment_url TEXT,
  source TEXT,
  
  -- Deal Scope & Terms
  territory_of_licensee TEXT,
  term_start DATE,
  term_end DATE,
  territories TEXT[], -- Array of territory codes
  music_type TEXT,
  music_use TEXT,
  smpte TEXT, -- Time code
  
  -- Rights & Splits
  linked_copyright_ids UUID[], -- References to copyrights table
  publisher_splits JSONB DEFAULT '{}',
  master_splits JSONB DEFAULT '{}',
  pub_share_percentage NUMERIC(5,2),
  master_share_percentage NUMERIC(5,2),
  
  -- Fees & Royalties
  pub_fee_all_in NUMERIC(12,2),
  pub_fee NUMERIC(12,2),
  master_fee NUMERIC(12,2),
  invoiced_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  royalties TEXT,
  
  -- Deal Approvals & Legal
  synch_status TEXT DEFAULT 'Inquiry' CHECK (synch_status IN ('Inquiry', 'Negotiating', 'Approved', 'Declined', 'Licensed')),
  approval_issued DATE,
  approval_documentation_url TEXT,
  first_confirmation_of_use DATE,
  license_status TEXT DEFAULT 'Drafted' CHECK (license_status IN ('Drafted', 'Issued', 'Fully Executed')),
  license_issued DATE,
  pe_license_received DATE,
  fe_license_returned BOOLEAN DEFAULT FALSE,
  fe_license_url TEXT,
  
  -- Invoicing & Payment
  invoice_status TEXT DEFAULT 'Not Issued' CHECK (invoice_status IN ('Not Issued', 'Issued', 'Paid')),
  invoice_issued DATE,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Paid in Full')),
  payment_received DATE,
  check_copy_remittance_url TEXT,
  
  -- Notes & Workflow
  notes TEXT,
  mfn BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sync licenses" 
ON public.sync_licenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync licenses" 
ON public.sync_licenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync licenses" 
ON public.sync_licenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync licenses" 
ON public.sync_licenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create sequence for sync ID generation
CREATE SEQUENCE IF NOT EXISTS sync_id_seq START 1000;

-- Function to generate sync ID
CREATE OR REPLACE FUNCTION public.generate_sync_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  sync_id TEXT;
BEGIN
  sync_id := 'SYNC-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('sync_id_seq')::text, 4, '0');
  RETURN sync_id;
END;
$$;

-- Trigger to auto-generate sync ID
CREATE OR REPLACE FUNCTION public.set_sync_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.synch_id IS NULL OR NEW.synch_id = '' THEN
    NEW.synch_id := public.generate_sync_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_sync_id_trigger
  BEFORE INSERT ON public.sync_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sync_id();

-- Trigger for updated_at
CREATE TRIGGER update_sync_licenses_updated_at
  BEFORE UPDATE ON public.sync_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create sync licensing comments table for notes and workflow tracking
CREATE TABLE public.sync_license_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_license_id UUID NOT NULL REFERENCES public.sync_licenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'note' CHECK (comment_type IN ('note', 'status_change', 'approval', 'payment')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE public.sync_license_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Users can view comments for their sync licenses"
ON public.sync_license_comments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.sync_licenses 
  WHERE id = sync_license_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create comments for their sync licenses"
ON public.sync_license_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.sync_licenses 
    WHERE id = sync_license_id AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_sync_licenses_user_id ON public.sync_licenses(user_id);
CREATE INDEX idx_sync_licenses_synch_status ON public.sync_licenses(synch_status);
CREATE INDEX idx_sync_licenses_created_at ON public.sync_licenses(created_at);
CREATE INDEX idx_sync_license_comments_sync_license_id ON public.sync_license_comments(sync_license_id);