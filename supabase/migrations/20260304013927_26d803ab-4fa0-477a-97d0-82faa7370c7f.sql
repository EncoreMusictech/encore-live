
-- Phase 1a: Add revenue_type to royalty_allocations
ALTER TABLE public.royalty_allocations
  ADD COLUMN IF NOT EXISTS revenue_type text;

ALTER TABLE public.royalty_allocations
  ADD CONSTRAINT royalty_allocations_revenue_type_check
  CHECK (revenue_type IS NULL OR revenue_type IN ('performance', 'mechanical', 'synch', 'other'));

-- Phase 1b: Add contract_deal_model to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_deal_model text DEFAULT 'ownership_split';

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_deal_model_check
  CHECK (contract_deal_model IN ('ownership_split', 'commission_only'));

-- Phase 1c: Add audit columns to payout_royalties
ALTER TABLE public.payout_royalties
  ADD COLUMN IF NOT EXISTS revenue_type text,
  ADD COLUMN IF NOT EXISTS party_id uuid REFERENCES public.contract_interested_parties(id),
  ADD COLUMN IF NOT EXISTS party_role text,
  ADD COLUMN IF NOT EXISTS split_percentage numeric(7,4),
  ADD COLUMN IF NOT EXISTS controlled_status text,
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id),
  ADD COLUMN IF NOT EXISTS ownership_snapshot jsonb;

-- Phase 1d: Update validate_royalty_splits with tolerance
CREATE OR REPLACE FUNCTION public.validate_royalty_splits(contract_id_param uuid)
 RETURNS TABLE(right_type text, total_percentage numeric, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        'performance' as right_type,
        COALESCE(SUM(performance_percentage), 0) as total_percentage,
        COALESCE(SUM(performance_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'mechanical' as right_type,
        COALESCE(SUM(mechanical_percentage), 0) as total_percentage,
        COALESCE(SUM(mechanical_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'synch' as right_type,
        COALESCE(SUM(synch_percentage), 0) as total_percentage,
        COALESCE(SUM(synch_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'print' as right_type,
        COALESCE(SUM(print_percentage), 0) as total_percentage,
        COALESCE(SUM(print_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'grand_rights' as right_type,
        COALESCE(SUM(grand_rights_percentage), 0) as total_percentage,
        COALESCE(SUM(grand_rights_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'karaoke' as right_type,
        COALESCE(SUM(karaoke_percentage), 0) as total_percentage,
        COALESCE(SUM(karaoke_percentage), 0) BETWEEN 99.99 AND 100.01 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
END;
$function$;
