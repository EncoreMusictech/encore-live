
-- Enhance payouts table with new status tracking and workflow fields
ALTER TABLE public.payouts
ADD COLUMN IF NOT EXISTS workflow_stage text DEFAULT 'draft' CHECK (workflow_stage IN ('draft', 'pending_review', 'approved', 'processing', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS payment_processor text,
ADD COLUMN IF NOT EXISTS payment_processor_reference text,
ADD COLUMN IF NOT EXISTS payment_initiated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_failed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failure_reason text,
ADD COLUMN IF NOT EXISTS auto_payment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_level integer DEFAULT 1 CHECK (priority_level >= 1 AND priority_level <= 5),
ADD COLUMN IF NOT EXISTS quarterly_report_id uuid REFERENCES public.quarterly_balance_reports(id) ON DELETE SET NULL;

-- Create payout workflow history table
CREATE TABLE IF NOT EXISTS public.payout_workflow_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for payout workflow history
ALTER TABLE public.payout_workflow_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payout workflow history
CREATE POLICY "Users can manage workflow history for their payouts" 
ON public.payout_workflow_history 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.payouts 
  WHERE payouts.id = payout_workflow_history.payout_id 
  AND payouts.user_id = auth.uid()
));

-- Create payment processing queue table
CREATE TABLE IF NOT EXISTS public.payment_processing_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scheduled_for timestamp with time zone DEFAULT now(),
  processing_status text DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  processor_type text NOT NULL,
  processor_config jsonb DEFAULT '{}',
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  last_attempt_at timestamp with time zone,
  next_retry_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for payment processing queue
ALTER TABLE public.payment_processing_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payment processing queue
CREATE POLICY "Users can manage their payment queue entries" 
ON public.payment_processing_queue 
FOR ALL 
USING (auth.uid() = user_id);

-- Create payout batch operations table
CREATE TABLE IF NOT EXISTS public.payout_batch_operations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('bulk_approve', 'bulk_process', 'bulk_export', 'bulk_cancel')),
  payout_ids uuid[] NOT NULL,
  operation_status text DEFAULT 'pending' CHECK (operation_status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  total_count integer NOT NULL,
  processed_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  operation_config jsonb DEFAULT '{}',
  results jsonb DEFAULT '{}',
  error_details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for payout batch operations
ALTER TABLE public.payout_batch_operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payout batch operations
CREATE POLICY "Users can manage their batch operations" 
ON public.payout_batch_operations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create payment integration settings table
CREATE TABLE IF NOT EXISTS public.payment_integration_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  integration_type text NOT NULL CHECK (integration_type IN ('stripe', 'paypal', 'wise', 'bank_transfer', 'manual')),
  integration_name text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}',
  supported_currencies text[] DEFAULT ARRAY['USD'],
  processing_fees jsonb DEFAULT '{}',
  limits jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, integration_type, integration_name)
);

-- Enable RLS for payment integration settings
ALTER TABLE public.payment_integration_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payment integration settings
CREATE POLICY "Users can manage their payment integrations" 
ON public.payment_integration_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update payout workflow stage
CREATE OR REPLACE FUNCTION public.update_payout_workflow_stage(
  payout_id_param uuid,
  new_stage text,
  reason_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stage text;
  payout_user_id uuid;
BEGIN
  -- Get current stage and verify user access
  SELECT workflow_stage, user_id 
  INTO current_stage, payout_user_id
  FROM public.payouts 
  WHERE id = payout_id_param;
  
  -- Verify user has access to this payout
  IF payout_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Update the payout stage
  UPDATE public.payouts 
  SET workflow_stage = new_stage,
      updated_at = now()
  WHERE id = payout_id_param;
  
  -- Log the workflow change
  INSERT INTO public.payout_workflow_history (
    payout_id, user_id, from_stage, to_stage, reason, metadata
  ) VALUES (
    payout_id_param, auth.uid(), current_stage, new_stage, reason_param, metadata_param
  );
END;
$$;

-- Create trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_payout_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER update_payment_processing_queue_updated_at
  BEFORE UPDATE ON public.payment_processing_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_payout_tables_updated_at();

CREATE TRIGGER update_payout_batch_operations_updated_at
  BEFORE UPDATE ON public.payout_batch_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_payout_tables_updated_at();

CREATE TRIGGER update_payment_integration_settings_updated_at
  BEFORE UPDATE ON public.payment_integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_payout_tables_updated_at();
