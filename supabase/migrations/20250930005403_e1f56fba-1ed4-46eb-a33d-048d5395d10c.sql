-- Fix function search_path security warnings by setting search_path = 'public'

-- Update catalog revenue sources updated_at
CREATE OR REPLACE FUNCTION public.update_catalog_revenue_sources_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update saved valuation scenarios updated_at
CREATE OR REPLACE FUNCTION public.update_saved_valuation_scenarios_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Update invoice templates updated_at
CREATE OR REPLACE FUNCTION public.update_invoice_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update sync invoices updated_at
CREATE OR REPLACE FUNCTION public.update_sync_invoices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Set user ID for invoice templates
CREATE OR REPLACE FUNCTION public.set_user_id_for_invoice_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$function$;

-- Update song estimator updated_at
CREATE OR REPLACE FUNCTION public.update_song_estimator_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update operations updated_at
CREATE OR REPLACE FUNCTION public.update_operations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update tenant configurations updated_at
CREATE OR REPLACE FUNCTION public.update_tenant_configurations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update payout workflow stage
CREATE OR REPLACE FUNCTION public.update_payout_workflow_stage(payout_id_param uuid, new_stage text, reason_param text DEFAULT NULL::text, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Expire client access
CREATE OR REPLACE FUNCTION public.expire_client_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired active client access
    UPDATE public.client_portal_access 
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiration activity
    IF expired_count > 0 THEN
        PERFORM public.log_security_event(
            NULL,
            'client_access_auto_expired',
            jsonb_build_object(
                'expired_count', expired_count,
                'timestamp', now()
            ),
            NULL,
            NULL,
            'info'
        );
    END IF;
    
    RETURN expired_count;
END;
$function$;

-- Expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired pending invitations
    UPDATE public.client_invitations 
    SET status = 'expired',
        auto_cleanup_scheduled_at = now() + INTERVAL '14 days'
    WHERE status = 'pending' 
    AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiration activity
    IF expired_count > 0 THEN
        PERFORM public.log_security_event(
            NULL,
            'invitation_auto_expired',
            jsonb_build_object(
                'expired_count', expired_count,
                'timestamp', now()
            ),
            NULL,
            NULL,
            'info'
        );
    END IF;
    
    RETURN expired_count;
END;
$function$;

-- Update notifications updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update notification preferences updated_at
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Cleanup expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete invitations that have been expired for more than 14 days
    DELETE FROM public.client_invitations 
    WHERE status = 'expired' 
    AND auto_cleanup_scheduled_at IS NOT NULL
    AND auto_cleanup_scheduled_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$function$;

-- Has role function (already has search_path but recreating for consistency)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update companies updated_at
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update company users updated_at
CREATE OR REPLACE FUNCTION public.update_company_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;