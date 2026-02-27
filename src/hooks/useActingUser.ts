import { useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useViewModeOptional } from '@/hooks/useViewModeOptional';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves the correct user ID for write operations.
 * 
 * When an ENCORE admin is operating in the context of a sub-account
 * (either via "View as User" or directly from the sub-account detail page),
 * all data should be attributed to the sub-account's service account —
 * NOT to the admin's personal user ID.
 *
 * Usage:
 *   const { getActingUserId } = useActingUser();
 *   const userId = await getActingUserId();
 */
export function useActingUser() {
  const { user } = useAuth();
  const { isViewingAsSubAccount, viewContext } = useViewModeOptional();

  /**
   * Resolve the acting user ID for write operations.
   * In view-as-sub-account mode, returns the service account user ID
   * (or first company user as fallback). Otherwise returns the logged-in user's ID.
   */
  const getActingUserId = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('No authenticated user');

    if (isViewingAsSubAccount && viewContext?.companyId) {
      // Try service account first
      try {
        const { data: serviceAccountUserId } = await supabase.rpc(
          'get_company_service_account_user_id',
          { _company_id: viewContext.companyId }
        );
        if (serviceAccountUserId) return serviceAccountUserId;
      } catch (e) {
        console.warn('Failed to fetch service account, falling back:', e);
      }

      // Fallback: first active company user
      try {
        const { data: companyUsers } = await supabase
          .from('company_users')
          .select('user_id')
          .eq('company_id', viewContext.companyId)
          .eq('status', 'active')
          .limit(1);
        if (companyUsers && companyUsers.length > 0) {
          return companyUsers[0].user_id;
        }
      } catch (e) {
        console.warn('Failed to fetch company users, falling back to admin:', e);
      }
    }

    return user.id;
  }, [user, isViewingAsSubAccount, viewContext?.companyId]);

  /**
   * For components that already have a companyId (e.g. sub-account detail page),
   * resolve the acting user for that specific company.
   */
  const getActingUserIdForCompany = useCallback(async (companyId: string): Promise<string> => {
    if (!user) throw new Error('No authenticated user');

    // Try service account first
    try {
      const { data: serviceAccountUserId } = await supabase.rpc(
        'get_company_service_account_user_id',
        { _company_id: companyId }
      );
      if (serviceAccountUserId) return serviceAccountUserId;
    } catch (e) {
      console.warn('Failed to fetch service account for company:', e);
    }

    // Fallback: first active company user
    try {
      const { data: companyUsers } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .limit(1);
      if (companyUsers && companyUsers.length > 0) {
        return companyUsers[0].user_id;
      }
    } catch (e) {
      console.warn('Failed to fetch company users:', e);
    }

    // Ultimate fallback: admin's own ID
    return user.id;
  }, [user]);

  return {
    getActingUserId,
    getActingUserIdForCompany,
  };
}
