import { supabase } from '@/integrations/supabase/client';

interface AutoLogParams {
  actionType: 'create' | 'update' | 'delete' | 'read' | 'export' | 'import';
  resourceType: string;
  resourceId?: string;
  actionDetails?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

/**
 * Automatically logs admin actions when in view mode
 * This is a standalone utility that can be called from anywhere
 */
export const autoLogAdminAction = async (params: AutoLogParams): Promise<void> => {
  try {
    // Check if in view mode
    const viewContextStr = sessionStorage.getItem('viewContext');
    if (!viewContextStr) return; // Not in view mode

    const viewContext = JSON.parse(viewContextStr);
    if (!viewContext.isViewMode || !viewContext.sessionId) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    switch (params.actionType) {
      case 'delete':
        riskLevel = 'high';
        break;
      case 'update':
      case 'create':
        riskLevel = 'medium';
        break;
      case 'export':
        riskLevel = 'medium';
        break;
      default:
        riskLevel = 'low';
    }

    // Get IP address (cached in session to avoid multiple calls)
    let ipAddress = sessionStorage.getItem('admin_ip_cache');
    if (!ipAddress) {
      ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      if (ipAddress) {
        sessionStorage.setItem('admin_ip_cache', ipAddress);
      }
    }

    // Prepare action details
    const actionDetails: Record<string, any> = {
      ...params.actionDetails,
      timestamp: new Date().toISOString()
    };

    if (params.oldValues) {
      actionDetails.old_values = params.oldValues;
    }
    if (params.newValues) {
      actionDetails.new_values = params.newValues;
    }

    // Log the action
    await supabase.rpc('log_admin_view_mode_action' as any, {
      p_admin_user_id: user.id,
      p_admin_email: user.email || '',
      p_session_id: viewContext.sessionId,
      p_action_type: `${params.actionType}_${params.resourceType}`,
      p_company_id: viewContext.companyId,
      p_company_name: viewContext.companyName || '',
      p_resource_type: params.resourceType,
      p_resource_id: params.resourceId || null,
      p_action_details: actionDetails,
      p_ip_address: ipAddress,
      p_user_agent: navigator.userAgent,
      p_request_path: window.location.pathname,
      p_risk_level: riskLevel
    });
  } catch (error) {
    // Silent fail - don't break the main operation
    console.error('[Audit Logger] Failed to log action:', error);
  }
};

/**
 * Higher-order function to wrap async operations with automatic logging
 */
export const withAuditLog = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  getLogParams: (...args: T) => AutoLogParams
) => {
  return async (...args: T): Promise<R> => {
    const logParams = getLogParams(...args);
    
    try {
      const result = await fn(...args);
      
      // Log successful action
      await autoLogAdminAction({
        ...logParams,
        actionDetails: {
          ...logParams.actionDetails,
          success: true
        }
      });
      
      return result;
    } catch (error) {
      // Log failed action
      await autoLogAdminAction({
        ...logParams,
        actionDetails: {
          ...logParams.actionDetails,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  };
};
