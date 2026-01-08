import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

// SOC2 Compliant Audit Log Categories
export type AuditCategory = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system_configuration'
  | 'user_management'
  | 'billing'
  | 'export'
  | 'terms_acceptance'
  | 'security';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'terms_accepted'
  | 'privacy_policy_accepted'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'download'
  | 'share'
  | 'permission_granted'
  | 'permission_revoked'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'module_accessed'
  | 'settings_changed'
  | 'api_key_created'
  | 'api_key_revoked';

export interface AuditLogEntry {
  category: AuditCategory;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  description: string;
  metadata?: Json;
  old_values?: Json;
  new_values?: Json;
  severity?: 'info' | 'warning' | 'critical';
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const log = useCallback(async (entry: AuditLogEntry) => {
    try {
      // Get client info
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      
      // Get or create session ID for correlation
      let sessionId = sessionStorage.getItem('audit_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('audit_session_id', sessionId);
      }

      // Log to system_audit_logs table
      const { error } = await supabase
        .from('system_audit_logs')
        .insert([{
          user_id: user?.id || null,
          user_email: user?.email || 'anonymous',
          session_id: sessionId,
          category: entry.category,
          action: entry.action,
          resource_type: entry.resource_type || null,
          resource_id: entry.resource_id || null,
          description: entry.description,
          metadata: entry.metadata || {},
          old_values: entry.old_values || null,
          new_values: entry.new_values || null,
          user_agent: userAgent,
          severity: entry.severity || 'info',
          ip_address: 'client',
        }]);

      if (error) {
        console.error('Audit log error:', error);
        // Fallback: log to console for debugging
        console.warn('[AUDIT]', entry);
      }

      return true;
    } catch (error) {
      console.error('Failed to write audit log:', error);
      return false;
    }
  }, [user]);

  // Convenience methods for common operations
  const logAuthentication = useCallback((action: 'login' | 'logout' | 'login_failed', metadata?: Json) => {
    return log({
      category: 'authentication',
      action,
      description: `User ${action === 'login' ? 'logged in' : action === 'logout' ? 'logged out' : 'failed login attempt'}`,
      metadata,
      severity: action === 'login_failed' ? 'warning' : 'info',
    });
  }, [log]);

  const logDataAccess = useCallback((resourceType: string, resourceId: string, action: 'view' | 'download' | 'export' = 'view') => {
    return log({
      category: 'data_access',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      description: `User ${action} ${resourceType}`,
    });
  }, [log]);

  const logDataModification = useCallback((
    resourceType: string, 
    resourceId: string, 
    action: 'create' | 'update' | 'delete',
    metadata?: Json,
    oldValues?: Json,
    newValues?: Json
  ) => {
    return log({
      category: 'data_modification',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      description: `User ${action}d ${resourceType}`,
      metadata,
      old_values: oldValues,
      new_values: newValues,
      severity: action === 'delete' ? 'warning' : 'info',
    });
  }, [log]);

  const logTermsAcceptance = useCallback((version: string, acceptedAt: string) => {
    return log({
      category: 'terms_acceptance',
      action: 'terms_accepted',
      description: 'User accepted terms and conditions',
      metadata: { version, accepted_at: acceptedAt },
      severity: 'info',
    });
  }, [log]);

  const logSecurityEvent = useCallback((description: string, metadata?: Json) => {
    return log({
      category: 'security',
      action: 'settings_changed',
      description,
      metadata,
      severity: 'critical',
    });
  }, [log]);

  const logModuleAccess = useCallback((moduleId: string) => {
    return log({
      category: 'authorization',
      action: 'module_accessed',
      resource_type: 'module',
      resource_id: moduleId,
      description: `User accessed ${moduleId} module`,
    });
  }, [log]);

  const logBillingEvent = useCallback((
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled',
    metadata?: Json
  ) => {
    return log({
      category: 'billing',
      action,
      description: `Subscription ${action.replace('subscription_', '')}`,
      metadata,
      severity: action === 'subscription_cancelled' ? 'warning' : 'info',
    });
  }, [log]);

  return {
    log,
    logAuthentication,
    logDataAccess,
    logDataModification,
    logTermsAcceptance,
    logSecurityEvent,
    logModuleAccess,
    logBillingEvent,
  };
};
