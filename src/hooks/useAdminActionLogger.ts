import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewMode } from '@/contexts/ViewModeContext';

interface LogActionParams {
  actionType: string;
  resourceType: string;
  resourceId?: string;
  actionDetails?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export const useAdminActionLogger = () => {
  const { viewContext, isViewingAsSubAccount } = useViewMode();

  const logAction = useCallback(async (params: LogActionParams) => {
    // Only log if in view mode
    if (!isViewingAsSubAccount || !viewContext?.companyId) return;

    try {
      // Get session data from storage
      const viewContextStr = sessionStorage.getItem('viewContext');
      if (!viewContextStr) return;

      const viewContext = JSON.parse(viewContextStr);
      const sessionId = viewContext.sessionId;

      if (!sessionId) return;

      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get IP address
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      // Determine risk level based on action type
      let riskLevel = params.riskLevel || 'low';
      if (params.actionType.includes('delete')) {
        riskLevel = 'high';
      } else if (params.actionType.includes('update') || params.actionType.includes('create')) {
        riskLevel = 'medium';
      }

      // Log the action
      const { error } = await supabase.rpc('log_admin_view_mode_action' as any, {
        p_admin_user_id: user.id,
        p_admin_email: user.email || '',
        p_session_id: sessionId,
        p_action_type: params.actionType,
        p_company_id: viewContext.companyId,
        p_company_name: viewContext.companyName || '',
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId || null,
        p_action_details: params.actionDetails || {},
        p_ip_address: ipAddress,
        p_user_agent: navigator.userAgent,
        p_request_path: window.location.pathname,
        p_risk_level: riskLevel
      });

      if (error) {
        console.error('Failed to log admin action:', error);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }, [isViewingAsSubAccount, viewContext]);

  const wrapAction = useCallback(async <T,>(
    action: () => Promise<T>,
    logParams: LogActionParams
  ): Promise<T> => {
    try {
      const result = await action();
      
      // Log the action after successful completion
      await logAction(logParams);
      
      return result;
    } catch (error) {
      // Log failed attempts as well
      await logAction({
        ...logParams,
        actionDetails: {
          ...logParams.actionDetails,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        },
        riskLevel: 'medium'
      });
      
      throw error;
    }
  }, [logAction]);

  return {
    logAction,
    wrapAction,
    isViewMode: isViewingAsSubAccount
  };
};
