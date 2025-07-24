-- Fix all remaining database functions to have secure search_path
-- This addresses the remaining "Function Search Path Mutable" warnings

-- Update all remaining functions to set secure search_path
CREATE OR REPLACE FUNCTION public.calculate_contract_controlled_percentage(contract_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    total_controlled NUMERIC;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN controlled_status = 'C' THEN 
                GREATEST(performance_percentage, mechanical_percentage, synch_percentage)
            ELSE 0 
        END
    ), 0)
    INTO total_controlled
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
    
    RETURN total_controlled;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contract_controlled_percentage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    contract_controlled_pct NUMERIC;
BEGIN
    -- Calculate the new controlled percentage
    contract_controlled_pct := public.calculate_contract_controlled_percentage(
        COALESCE(NEW.contract_id, OLD.contract_id)
    );
    
    -- Update the contract record
    UPDATE public.contracts
    SET controlled_percentage = contract_controlled_pct,
        updated_at = now()
    WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Update balance when payout is created, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        -- Handle deletion
        INSERT INTO public.client_account_balances (user_id, client_id, current_balance, total_earned, total_paid)
        SELECT 
            OLD.user_id,
            OLD.client_id,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'approved' THEN p.amount_due ELSE 0 END), 0),
            COALESCE(SUM(p.gross_royalties), 0),
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0)
        FROM public.payouts p
        WHERE p.user_id = OLD.user_id AND p.client_id = OLD.client_id
        GROUP BY p.user_id, p.client_id
        ON CONFLICT (user_id, client_id) DO UPDATE SET
            current_balance = EXCLUDED.current_balance,
            total_earned = EXCLUDED.total_earned,
            total_paid = EXCLUDED.total_paid,
            updated_at = now();
        
        RETURN OLD;
    ELSE
        -- Handle insert or update
        INSERT INTO public.client_account_balances (user_id, client_id, current_balance, total_earned, total_paid)
        SELECT 
            NEW.user_id,
            NEW.client_id,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'approved' THEN p.amount_due ELSE 0 END), 0),
            COALESCE(SUM(p.gross_royalties), 0),
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0)
        FROM public.payouts p
        WHERE p.user_id = NEW.user_id AND p.client_id = NEW.client_id
        GROUP BY p.user_id, p.client_id
        ON CONFLICT (user_id, client_id) DO UPDATE SET
            current_balance = EXCLUDED.current_balance,
            total_earned = EXCLUDED.total_earned,
            total_paid = EXCLUDED.total_paid,
            updated_at = now();
        
        RETURN NEW;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_writer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.writer_id IS NULL OR NEW.writer_id = '' THEN
        NEW.writer_id := public.generate_writer_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_closing_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.closing_balance := ROUND(
        NEW.opening_balance + NEW.royalties_amount - NEW.expenses_amount - NEW.payments_amount, 
        2
    );
    NEW.is_calculated := true;
    NEW.calculation_date := now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_statement_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_statement_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_statement_id := 'STMT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalties_import_staging WHERE statement_id = new_statement_id) THEN
            RETURN new_statement_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_statement_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.statement_id IS NULL OR NEW.statement_id = '' THEN
        NEW.statement_id := public.generate_statement_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_royalty_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_royalty_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_royalty_id := 'ROY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalty_allocations WHERE royalty_id = new_royalty_id) THEN
            RETURN new_royalty_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_royalty_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.royalty_id IS NULL OR NEW.royalty_id = '' THEN
        NEW.royalty_id := public.generate_royalty_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_next_period_opening_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    next_year INTEGER;
    next_quarter INTEGER;
BEGIN
    -- Calculate next period
    IF NEW.quarter = 4 THEN
        next_year := NEW.year + 1;
        next_quarter := 1;
    ELSE
        next_year := NEW.year;
        next_quarter := NEW.quarter + 1;
    END IF;
    
    -- Update or insert next period record
    INSERT INTO public.quarterly_balance_reports (
        user_id, payee_id, contact_id, agreement_id, 
        year, quarter, opening_balance
    )
    VALUES (
        NEW.user_id, NEW.payee_id, NEW.contact_id, NEW.agreement_id,
        next_year, next_quarter, NEW.closing_balance
    )
    ON CONFLICT (user_id, payee_id, year, quarter) 
    DO UPDATE SET 
        opening_balance = NEW.closing_balance,
        updated_at = now();
        
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_reconciliation_batch_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_batch_id text;
BEGIN
    -- Only set batch_id if it's null or empty
    IF NEW.batch_id IS NULL OR NEW.batch_id = '' THEN
        -- Generate new batch ID
        new_batch_id := public.generate_batch_id();
        NEW.batch_id := new_batch_id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_batch_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.batch_id IS NULL OR NEW.batch_id = '' THEN
        NEW.batch_id := public.generate_batch_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payout_tables_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_batch_id_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.batch_id IS NULL THEN
    NEW.batch_id := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_client_portal_access(_user_id uuid, _module text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_subscriber(_client_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT subscriber_user_id 
    FROM public.client_portal_access 
    WHERE client_user_id = _client_user_id 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
$function$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    token text;
BEGIN
    token := encode(gen_random_bytes(32), 'base64');
    -- Remove URL-unsafe characters
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    RETURN token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.invitation_token IS NULL OR NEW.invitation_token = '' THEN
        NEW.invitation_token := public.generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_import_staging_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If the reconciliation batch status is updated to 'Processed' and it has a linked statement
  IF NEW.status = 'Processed' AND OLD.status != 'Processed' AND NEW.linked_statement_id IS NOT NULL THEN
    UPDATE public.royalties_import_staging 
    SET processing_status = 'processed'
    WHERE id = NEW.linked_statement_id;
    
    RAISE LOG 'Updated import staging record % status to processed due to batch % being processed', NEW.linked_statement_id, NEW.id;
  END IF;
  
  -- If the reconciliation batch status is updated back to 'Pending' or 'Imported' and it has a linked statement
  IF (NEW.status = 'Pending' OR NEW.status = 'Imported') AND OLD.status = 'Processed' AND NEW.linked_statement_id IS NOT NULL THEN
    -- Check if the staging record has validation errors or unmapped fields
    UPDATE public.royalties_import_staging 
    SET processing_status = CASE 
      WHEN (validation_status->>'hasErrors')::boolean = true OR 
           (validation_status->>'hasUnmapped')::boolean = true OR
           array_length(unmapped_fields, 1) > 0 
      THEN 'needs_review'
      ELSE 'pending'
    END
    WHERE id = NEW.linked_statement_id;
    
    RAISE LOG 'Reverted import staging record % status due to batch % status change', NEW.linked_statement_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_royalty_work_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Only set work_id if it's NULL or empty
    IF NEW.work_id IS NULL OR NEW.work_id = '' THEN
        NEW.work_id := public.generate_royalty_work_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_invitations_needing_reminders()
RETURNS TABLE(id uuid, email text, subscriber_user_id uuid, expires_at timestamp with time zone, reminder_count integer, days_until_expiry integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT 
        ci.id,
        ci.email,
        ci.subscriber_user_id,
        ci.expires_at,
        ci.reminder_count,
        EXTRACT(DAYS FROM (ci.expires_at - now()))::INTEGER as days_until_expiry
    FROM public.client_invitations ci
    WHERE ci.status = 'pending'
    AND ci.expires_at > now()
    AND (
        -- First reminder: 3 days before expiry, no reminders sent yet
        (EXTRACT(DAYS FROM (ci.expires_at - now())) <= 3 AND ci.reminder_count = 0)
        OR
        -- Second reminder: 1 day before expiry, only one reminder sent
        (EXTRACT(DAYS FROM (ci.expires_at - now())) <= 1 AND ci.reminder_count = 1)
    );
$function$;

CREATE OR REPLACE FUNCTION public.mark_invitation_reminder_sent(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.client_invitations 
    SET reminder_sent_at = now(),
        reminder_count = reminder_count + 1
    WHERE id = invitation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_sync_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.synch_id IS NULL OR NEW.synch_id = '' THEN
    NEW.synch_id := public.generate_sync_id();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_work_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.work_id IS NULL THEN
        NEW.work_id := public.generate_work_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_controlled_share(copyright_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    total_controlled numeric;
BEGIN
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_controlled
    FROM public.copyright_writers
    WHERE copyright_id = copyright_id_param
    AND controlled_status = 'C';
    
    RETURN total_controlled;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_controlled_share()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    total_controlled numeric;
BEGIN
    -- Calculate the new total controlled share
    total_controlled := public.calculate_controlled_share(COALESCE(NEW.copyright_id, OLD.copyright_id));
    
    -- Update the copyright record with calculated controlled share
    UPDATE public.copyrights
    SET validation_status = jsonb_set(
        COALESCE(validation_status, '{}'::jsonb),
        '{total_controlled_share}',
        to_jsonb(total_controlled)
    )
    WHERE id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.grant_module_access_on_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.subscription_type = 'module' THEN
    -- Grant access to the specific module
    INSERT INTO public.user_module_access (user_id, module_id, access_source, subscription_id, expires_at)
    SELECT NEW.user_id, mp.module_id, 'module_subscription', NEW.id, NEW.expires_at
    FROM public.module_products mp
    WHERE mp.id = NEW.product_id
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      subscription_id = EXCLUDED.subscription_id,
      expires_at = EXCLUDED.expires_at;
      
  ELSIF NEW.subscription_type = 'bundle' THEN
    -- Grant access to all modules in the bundle
    INSERT INTO public.user_module_access (user_id, module_id, access_source, subscription_id, expires_at)
    SELECT NEW.user_id, unnest(bp.included_modules), 'bundle_subscription', NEW.id, NEW.expires_at
    FROM public.bundle_products bp
    WHERE bp.id = NEW.product_id
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      subscription_id = EXCLUDED.subscription_id,
      expires_at = EXCLUDED.expires_at;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_copyright_internal_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_id := 'CR' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE internal_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_copyright_internal_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.internal_id IS NULL THEN
        NEW.internal_id := public.generate_copyright_internal_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_copyright_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    total_writers_share numeric(5,2);
    total_publishers_share numeric(5,2);
BEGIN
    -- Calculate total writer ownership
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_writers_share
    FROM public.copyright_writers
    WHERE copyright_id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    -- Calculate total publisher ownership
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_publishers_share
    FROM public.copyright_publishers
    WHERE copyright_id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    -- Update validation status on the copyright record
    UPDATE public.copyrights
    SET validation_status = jsonb_build_object(
        'writers_total', total_writers_share,
        'publishers_total', total_publishers_share,
        'writers_valid', total_writers_share <= 100,
        'publishers_valid', total_publishers_share <= 100,
        'last_validated', now()
    )
    WHERE id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_sync_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  sync_id TEXT;
BEGIN
  sync_id := 'SYNC-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('sync_id_seq')::text, 4, '0');
  RETURN sync_id;
END;
$function$;