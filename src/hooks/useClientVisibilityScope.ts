import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortalIdentity } from '@/contexts/ClientPortalContext';

export interface VisibilityScope {
  scope_type: 'all' | 'artist' | 'label' | 'custom';
  artists?: string[];       // artist names to filter by
  labels?: string[];        // client_company_ids to filter by
  work_ids?: string[];      // specific copyright IDs
  contract_ids?: string[];  // specific contract IDs
  sync_ids?: string[];      // specific sync license IDs
  royalty_ids?: string[];   // specific royalty allocation IDs
}

/**
 * Hook that retrieves the client's visibility scope from client_portal_access.
 * Uses the effective user ID from ClientPortalContext (supports admin preview).
 */
export function useClientVisibilityScope() {
  const { user } = useAuth();
  let portalUserId: string | undefined;
  try {
    const { effectiveUserId } = useClientPortalIdentity();
    portalUserId = effectiveUserId;
  } catch {
    portalUserId = user?.id;
  }
  const [scope, setScope] = useState<VisibilityScope>({ scope_type: 'all' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScope = async () => {
      if (!portalUserId) { setLoading(false); return; }
      
      try {
        const { data, error } = await supabase
          .from('client_portal_access')
          .select('*')
          .eq('client_user_id', portalUserId)
          .eq('status', 'active')
          .maybeSingle();

        if (!error && data) {
          const vs = (data as any).visibility_scope;
          if (vs) setScope(vs as VisibilityScope);
        }
      } catch (err) {
        console.error('Error fetching visibility scope:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScope();
  }, [portalUserId]);

  /**
   * Apply scope filtering to a copyrights query.
   * Returns filtered IDs or null if no filtering needed.
   */
  const applyCopyrightScopeFilter = async (baseQuery: any) => {
    if (scope.scope_type === 'all') return baseQuery;

    if (scope.scope_type === 'custom' && scope.work_ids?.length) {
      return baseQuery.in('id', scope.work_ids);
    }

    if (scope.scope_type === 'label' && scope.labels?.length) {
      return baseQuery.in('client_company_id', scope.labels);
    }

    if (scope.scope_type === 'artist' && scope.artists?.length) {
      // Use copyright_writers to find copyrights by artist name
      const { data: writerLinks } = await supabase
        .from('copyright_writers')
        .select('copyright_id, writer_name')
        .in('writer_name', scope.artists);
      
      if (writerLinks?.length) {
        const copyrightIds = [...new Set(writerLinks.map(w => w.copyright_id))];
        return baseQuery.in('id', copyrightIds);
      }
      // No matches - return impossible filter
      return baseQuery.in('id', ['__no_match__']);
    }

    return baseQuery;
  };

  /**
   * Apply scope filtering to contracts query
   */
  const applyContractScopeFilter = (baseQuery: any) => {
    if (scope.scope_type === 'all') return baseQuery;

    if (scope.scope_type === 'custom' && scope.contract_ids?.length) {
      return baseQuery.in('id', scope.contract_ids);
    }

    if (scope.scope_type === 'label' && scope.labels?.length) {
      return baseQuery.in('client_company_id', scope.labels);
    }

    // For artist scope, contracts don't have direct artist field - fall through to data associations
    return baseQuery;
  };

  /**
   * Apply scope filtering to sync licenses query
   */
  const applySyncScopeFilter = (baseQuery: any) => {
    if (scope.scope_type === 'all') return baseQuery;

    if (scope.scope_type === 'custom' && scope.sync_ids?.length) {
      return baseQuery.in('id', scope.sync_ids);
    }

    // Sync licenses don't have direct label/artist fields
    return baseQuery;
  };

  /**
   * Apply scope filtering to royalty allocations query
   */
  const applyRoyaltyScopeFilter = (baseQuery: any) => {
    if (scope.scope_type === 'all') return baseQuery;

    if (scope.scope_type === 'custom' && scope.royalty_ids?.length) {
      return baseQuery.in('id', scope.royalty_ids);
    }

    if (scope.scope_type === 'artist' && scope.artists?.length) {
      return baseQuery.in('artist', scope.artists);
    }

    return baseQuery;
  };

  return {
    scope,
    loading,
    isScoped: scope.scope_type !== 'all',
    applyCopyrightScopeFilter,
    applyContractScopeFilter,
    applySyncScopeFilter,
    applyRoyaltyScopeFilter,
  };
}
