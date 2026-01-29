import { useState, useEffect, useMemo, useCallback } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { supabase } from '@/integrations/supabase/client';

interface HierarchicalFilterConfig {
  userIds: string[];
  companyIds: string[];
  mode: 'system' | 'aggregate' | 'single';
  isActive: boolean;
}

interface UseHierarchicalFilteringReturn {
  filterConfig: HierarchicalFilterConfig;
  loading: boolean;
  filterKey: string;
  applyUserIdFilter: <T>(query: T) => T;
  applyCompanyIdFilter: <T>(query: T) => T;
  applyClientCompanyIdFilter: <T>(query: T) => T;
  isUserInScope: (userId: string) => boolean;
  isCompanyInScope: (companyId: string) => boolean;
  getFilterSummary: () => string;
}

/**
 * Extended filtering hook that supports the 3-tier hierarchy:
 * - System: No filtering (ENCORE admins)
 * - Aggregate: See all data for parent + all child companies
 * - Single: See only data for a specific company
 */
export function useHierarchicalFiltering(): UseHierarchicalFilteringReturn {
  const { viewContext, isViewingAsSubAccount } = useViewMode();
  const [filterConfig, setFilterConfig] = useState<HierarchicalFilterConfig>({
    userIds: [],
    companyIds: [],
    mode: 'system',
    isActive: false,
  });
  const [loading, setLoading] = useState(false);

  const loadFilterConfig = useCallback(async () => {
    // No filtering for system mode
    if (!isViewingAsSubAccount || !viewContext?.companyId) {
      setFilterConfig({
        userIds: [],
        companyIds: [],
        mode: 'system',
        isActive: false,
      });
      return;
    }

    setLoading(true);

    try {
      // Check if we're in aggregate mode (viewing all clients under a publishing firm)
      const isAggregateMode = viewContext.viewScope === 'all' && viewContext.parentCompanyId;

      if (isAggregateMode && viewContext.parentCompanyId) {
        // Aggregate mode: get all user IDs from parent + child companies
        const { data: hierarchyUsers, error: hierarchyError } = await supabase.rpc(
          'get_company_hierarchy_user_ids',
          { _company_id: viewContext.parentCompanyId }
        );

        if (hierarchyError) throw hierarchyError;

        // Also get all child company IDs
        const { data: childCompanies, error: childError } = await supabase.rpc(
          'get_child_companies',
          { _parent_id: viewContext.parentCompanyId }
        );

        if (childError) throw childError;

        const companyIds = [
          viewContext.parentCompanyId,
          ...(childCompanies?.map((c: any) => c.company_id) || [])
        ];

        setFilterConfig({
          userIds: hierarchyUsers?.map((r: any) => r.user_id) || [],
          companyIds,
          mode: 'aggregate',
          isActive: true,
        });
      } else {
        // Single company mode
        const { data: companyUsers, error } = await supabase
          .from('company_users')
          .select('user_id')
          .eq('company_id', viewContext.companyId)
          .eq('status', 'active');

        if (error) throw error;

        setFilterConfig({
          userIds: companyUsers?.map((cu) => cu.user_id) || [],
          companyIds: [viewContext.companyId],
          mode: 'single',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error loading hierarchical filter config:', error);
      setFilterConfig({
        userIds: [],
        companyIds: [],
        mode: 'system',
        isActive: false,
      });
    } finally {
      setLoading(false);
    }
  }, [isViewingAsSubAccount, viewContext?.companyId, viewContext?.viewScope, viewContext?.parentCompanyId]);

  useEffect(() => {
    loadFilterConfig();
  }, [loadFilterConfig]);

  // Create a stable filter key for use as a dependency in other hooks
  const filterKey = useMemo(() => {
    if (!filterConfig.isActive) {
      return 'no-filter';
    }
    return `${filterConfig.mode}-${filterConfig.companyIds.join(',')}-${filterConfig.userIds.length}`;
  }, [filterConfig.isActive, filterConfig.mode, filterConfig.companyIds, filterConfig.userIds.length]);

  /**
   * Apply filters to queries with user_id column
   */
  const applyUserIdFilter = useCallback(<T>(query: T): T => {
    if (!filterConfig.isActive || filterConfig.userIds.length === 0) {
      return query;
    }
    return (query as any).in('user_id', filterConfig.userIds) as T;
  }, [filterConfig.isActive, filterConfig.userIds]);

  /**
   * Apply filters to queries with company_id column
   */
  const applyCompanyIdFilter = useCallback(<T>(query: T): T => {
    if (!filterConfig.isActive || filterConfig.companyIds.length === 0) {
      return query;
    }
    if (filterConfig.companyIds.length === 1) {
      return (query as any).eq('company_id', filterConfig.companyIds[0]) as T;
    }
    return (query as any).in('company_id', filterConfig.companyIds) as T;
  }, [filterConfig.isActive, filterConfig.companyIds]);

  /**
   * Apply filters to queries with client_company_id column (new hierarchical field)
   */
  const applyClientCompanyIdFilter = useCallback(<T>(query: T): T => {
    if (!filterConfig.isActive || filterConfig.companyIds.length === 0) {
      return query;
    }
    if (filterConfig.companyIds.length === 1) {
      return (query as any).eq('client_company_id', filterConfig.companyIds[0]) as T;
    }
    return (query as any).in('client_company_id', filterConfig.companyIds) as T;
  }, [filterConfig.isActive, filterConfig.companyIds]);

  /**
   * Check if a user ID is in the current scope
   */
  const isUserInScope = useCallback((userId: string): boolean => {
    if (!filterConfig.isActive) return true;
    return filterConfig.userIds.includes(userId);
  }, [filterConfig.isActive, filterConfig.userIds]);

  /**
   * Check if a company ID is in the current scope
   */
  const isCompanyInScope = useCallback((companyId: string): boolean => {
    if (!filterConfig.isActive) return true;
    return filterConfig.companyIds.includes(companyId);
  }, [filterConfig.isActive, filterConfig.companyIds]);

  /**
   * Get a human-readable summary of the current filter
   */
  const getFilterSummary = useCallback((): string => {
    if (!filterConfig.isActive) {
      return 'Showing all data';
    }

    if (filterConfig.mode === 'aggregate') {
      return `Aggregated view: ${viewContext?.companyName} + ${filterConfig.companyIds.length - 1} client labels`;
    }

    return `Filtered to ${viewContext?.companyName} (${filterConfig.userIds.length} user${filterConfig.userIds.length !== 1 ? 's' : ''})`;
  }, [filterConfig, viewContext?.companyName]);

  return {
    filterConfig,
    loading,
    filterKey,
    applyUserIdFilter,
    applyCompanyIdFilter,
    applyClientCompanyIdFilter,
    isUserInScope,
    isCompanyInScope,
    getFilterSummary,
  };
}
