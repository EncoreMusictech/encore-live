import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewModeOptional } from '@/hooks/useViewModeOptional';

export interface CompanyBrandingConfig {
  enabled: boolean;
  logo_url: string;
  display_name: string;
  colors: {
    primary: string;
    accent: string;
    headerBg: string;
  };
}

interface UseCompanyBrandingResult {
  branding: CompanyBrandingConfig | null;
  loading: boolean;
}

/**
 * Resolves branding for the current user's company.
 * - If in view mode, uses the viewed company's branding.
 * - If the company has branding enabled, uses it.
 * - If not, checks the parent company for inherited branding.
 */
export function useCompanyBranding(): UseCompanyBrandingResult {
  const { user } = useAuth();
  const { isViewingAsSubAccount, viewContext } = useViewModeOptional();
  const [branding, setBranding] = useState<CompanyBrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const resolve = async () => {
      try {
        let companyId: string | null = null;

        if (isViewingAsSubAccount && viewContext?.companyId) {
          // Admin viewing as sub-account — use that company
          companyId = viewContext.companyId;
        } else {
          // Normal user — find their company
          const { data: membership } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

          companyId = membership?.company_id || null;
        }

        if (!companyId) {
          setLoading(false);
          return;
        }

        // Try to get branding from this company
        const resolved = await resolveBranding(companyId);
        setBranding(resolved);
      } catch (err) {
        console.error('Error resolving company branding:', err);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [user, isViewingAsSubAccount, viewContext?.companyId]);

  return { branding, loading };
}

/**
 * Check a company for branding. If not found, check parent company.
 */
async function resolveBranding(companyId: string): Promise<CompanyBrandingConfig | null> {
  // 1. Check if whitelabel module is enabled
  const { data: moduleAccess } = await supabase
    .from('company_module_access')
    .select('enabled')
    .eq('company_id', companyId)
    .eq('module_id', 'whitelabel_branding')
    .maybeSingle();

  if (moduleAccess?.enabled) {
    // 2. Get branding from company settings
    const { data: company } = await supabase
      .from('companies')
      .select('settings, parent_company_id')
      .eq('id', companyId)
      .single();

    if (company) {
      const settings = company.settings as Record<string, any> | null;
      if (settings?.branding?.enabled) {
        return settings.branding as CompanyBrandingConfig;
      }
    }
  }

  // 3. Check parent company for inherited branding
  const { data: company } = await supabase
    .from('companies')
    .select('parent_company_id')
    .eq('id', companyId)
    .single();

  if (company?.parent_company_id) {
    return resolveBranding(company.parent_company_id);
  }

  return null;
}
