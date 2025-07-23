
-- Phase 1: Critical Database Security and Foreign Key Fixes

-- 1. Add missing foreign keys for data integrity
ALTER TABLE public.payout_expenses 
ADD CONSTRAINT fk_payout_expenses_contracts 
FOREIGN KEY (agreement_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

ALTER TABLE public.payout_expenses 
ADD CONSTRAINT fk_payout_expenses_payees 
FOREIGN KEY (payee_id) REFERENCES public.payees(id) ON DELETE SET NULL;

ALTER TABLE public.payout_expenses 
ADD CONSTRAINT fk_payout_expenses_copyrights 
FOREIGN KEY (work_id) REFERENCES public.copyrights(id) ON DELETE SET NULL;

ALTER TABLE public.client_account_balances 
ADD CONSTRAINT fk_client_account_balances_contacts 
FOREIGN KEY (client_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.payouts 
ADD CONSTRAINT fk_payouts_contacts 
FOREIGN KEY (client_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.payouts 
ADD CONSTRAINT fk_payouts_quarterly_reports 
FOREIGN KEY (quarterly_report_id) REFERENCES public.quarterly_balance_reports(id) ON DELETE SET NULL;

-- 2. Fix RLS policies with security definer functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_client_ids(p_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN ARRAY(
        SELECT client_id 
        FROM public.client_portal_access 
        WHERE client_user_id = p_user_id 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;

-- Update client portal access policies to use security definer function
DROP POLICY IF EXISTS "Clients can view assigned copyrights" ON public.copyrights;
CREATE POLICY "Clients can view assigned copyrights" 
ON public.copyrights 
FOR SELECT 
USING (
    has_client_portal_access(auth.uid(), 'copyright') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid() 
        AND cda.data_type = 'copyright' 
        AND cda.data_id = copyrights.id
    )
);

DROP POLICY IF EXISTS "Clients can view assigned contracts" ON public.contracts;
CREATE POLICY "Clients can view assigned contracts" 
ON public.contracts 
FOR SELECT 
USING (
    has_client_portal_access(auth.uid(), 'contracts') 
    AND EXISTS (
        SELECT 1 FROM public.client_data_associations cda
        WHERE cda.client_user_id = auth.uid() 
        AND cda.data_type = 'contract' 
        AND cda.data_id = contracts.id
    )
);

-- 3. Add validation triggers for data integrity
CREATE OR REPLACE FUNCTION public.validate_payout_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure amount_due cannot be negative
    IF NEW.amount_due < 0 THEN
        RAISE EXCEPTION 'Amount due cannot be negative';
    END IF;
    
    -- Ensure gross_royalties cannot be negative
    IF NEW.gross_royalties < 0 THEN
        RAISE EXCEPTION 'Gross royalties cannot be negative';
    END IF;
    
    -- Ensure net_payable is calculated correctly
    IF NEW.net_payable != (NEW.gross_royalties - NEW.total_expenses) THEN
        NEW.net_payable := NEW.gross_royalties - NEW.total_expenses;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_payout_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_payout_amounts();

-- 4. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_payout_changes()
RETURNS TRIGGER AS $$
DECLARE
    operation_type text;
    changes jsonb := '{}';
BEGIN
    IF TG_OP = 'INSERT' THEN
        operation_type := 'payout_created';
        changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'payout_updated';
        changes := jsonb_build_object(
            'old_values', to_jsonb(OLD),
            'new_values', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        operation_type := 'payout_deleted';
        changes := to_jsonb(OLD);
    END IF;
    
    -- Log the change
    PERFORM public.log_security_event(
        auth.uid(),
        operation_type,
        changes,
        inet_client_addr()::text,
        NULL,
        'medium'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_payout_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_payout_changes();

-- 5. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_payouts_workflow_stage ON public.payouts(workflow_stage) WHERE workflow_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payouts_client_status ON public.payouts(client_id, workflow_stage);
CREATE INDEX IF NOT EXISTS idx_payout_expenses_status ON public.payout_expenses(expense_status, user_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_active ON public.client_portal_access(client_user_id, status) WHERE status = 'active';

-- 6. Fix bulk operation function security
CREATE OR REPLACE FUNCTION public.process_bulk_payout_operation(
    operation_id uuid,
    operation_type text,
    payout_ids uuid[],
    operation_config jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    success_count integer := 0;
    error_count integer := 0;
    results jsonb := '{}';
    payout_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user and validate access
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Validate that user owns all payouts
    IF EXISTS (
        SELECT 1 FROM public.payouts 
        WHERE id = ANY(payout_ids) 
        AND user_id != current_user_id
    ) THEN
        RAISE EXCEPTION 'Access denied: Cannot modify payouts owned by other users';
    END IF;
    
    -- Process each payout
    FOREACH payout_id IN ARRAY payout_ids LOOP
        BEGIN
            CASE operation_type
                WHEN 'bulk_approve' THEN
                    UPDATE public.payouts 
                    SET workflow_stage = 'approved', updated_at = now()
                    WHERE id = payout_id AND user_id = current_user_id;
                    
                WHEN 'bulk_process' THEN
                    UPDATE public.payouts 
                    SET workflow_stage = 'processing', updated_at = now()
                    WHERE id = payout_id AND user_id = current_user_id;
                    
                WHEN 'bulk_cancel' THEN
                    UPDATE public.payouts 
                    SET workflow_stage = 'draft', updated_at = now()
                    WHERE id = payout_id AND user_id = current_user_id;
                    
                ELSE
                    RAISE EXCEPTION 'Invalid operation type: %', operation_type;
            END CASE;
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            -- Log the error but continue processing
            PERFORM public.log_security_event(
                current_user_id,
                'bulk_operation_error',
                jsonb_build_object(
                    'payout_id', payout_id,
                    'operation_type', operation_type,
                    'error', SQLERRM
                ),
                inet_client_addr()::text,
                NULL,
                'high'
            );
        END;
    END LOOP;
    
    -- Update batch operation record
    UPDATE public.payout_batch_operations
    SET processed_count = success_count,
        failed_count = error_count,
        operation_status = CASE 
            WHEN error_count = 0 THEN 'completed'
            WHEN success_count = 0 THEN 'failed'
            ELSE 'partial'
        END,
        results = jsonb_build_object(
            'success_count', success_count,
            'error_count', error_count,
            'total_count', array_length(payout_ids, 1)
        ),
        updated_at = now()
    WHERE id = operation_id;
    
    RETURN jsonb_build_object(
        'success_count', success_count,
        'error_count', error_count,
        'total_count', array_length(payout_ids, 1)
    );
END;
$$;

-- 7. Add rate limiting for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier text NOT NULL,
    action_type text NOT NULL,
    attempt_count integer DEFAULT 1,
    first_attempt timestamp with time zone DEFAULT now(),
    last_attempt timestamp with time zone DEFAULT now(),
    blocked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(identifier, action_type)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate_limits
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);
