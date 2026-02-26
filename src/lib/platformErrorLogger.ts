import { supabase } from "@/integrations/supabase/client";

interface LogErrorParams {
  error_source: string;
  error_type: string;
  error_message: string;
  error_details?: Record<string, any>;
  module?: string;
  action?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  company_id?: string;
  company_name?: string;
}

/**
 * Log an error to the platform_error_logs table.
 * Call this from catch blocks across the app to capture detailed error data.
 */
export async function logPlatformError(params: LogErrorParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('platform_error_logs').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      error_source: params.error_source,
      error_type: params.error_type,
      error_message: params.error_message,
      error_details: params.error_details ?? null,
      module: params.module ?? null,
      action: params.action ?? null,
      severity: params.severity ?? 'error',
      company_id: params.company_id ?? null,
      company_name: params.company_name ?? null,
    });
  } catch (e) {
    // Silent fail — don't let error logging break the app
    console.error('[logPlatformError] Failed to log error:', e);
  }
}
