-- Create function to check if a contract has active royalty connections to payees
CREATE OR REPLACE FUNCTION public.check_contract_payee_connections(contract_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    connection_count INTEGER;
    payout_count INTEGER;
    allocation_count INTEGER;
    result jsonb;
BEGIN
    -- Check contract_royalty_connections
    SELECT COUNT(*)
    INTO connection_count
    FROM public.contract_royalty_connections
    WHERE contract_id = contract_id_param;
    
    -- Check if any payouts reference this contract through royalty allocations
    SELECT COUNT(DISTINCT p.id)
    INTO payout_count
    FROM public.payouts p
    JOIN public.payout_royalties pr ON p.id = pr.payout_id
    JOIN public.royalty_allocations ra ON pr.royalty_id = ra.id
    WHERE ra.copyright_id IN (
        SELECT sw.copyright_id 
        FROM public.contract_schedule_works sw 
        WHERE sw.contract_id = contract_id_param
        AND sw.copyright_id IS NOT NULL
    );
    
    -- Check if any royalty allocations are connected to this contract's works
    SELECT COUNT(*)
    INTO allocation_count
    FROM public.royalty_allocations ra
    WHERE ra.copyright_id IN (
        SELECT sw.copyright_id 
        FROM public.contract_schedule_works sw 
        WHERE sw.contract_id = contract_id_param
        AND sw.copyright_id IS NOT NULL
    );
    
    -- Build result object
    result := jsonb_build_object(
        'has_connections', (connection_count > 0 OR payout_count > 0 OR allocation_count > 0),
        'royalty_connections', connection_count,
        'active_payouts', payout_count,
        'royalty_allocations', allocation_count,
        'can_delete', (connection_count = 0 AND payout_count = 0 AND allocation_count = 0)
    );
    
    RETURN result;
END;
$$;