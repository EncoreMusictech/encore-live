import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingConfig {
  enabled: boolean;
  logo_url: string;
  display_name: string;
  colors: {
    primary: string;
    accent: string;
    headerBg: string;
  };
}

interface UseClientBrandingResult {
  branding: BrandingConfig | null;
  loading: boolean;
}

/**
 * Resolves whitelabel branding for a client portal user.
 * Looks up: client_portal_access → subscriber → company → branding settings.
 * If adminUserId is provided, also tries resolving via the admin's company as fallback.
 */
export function useClientBranding(userId: string | undefined, adminUserId?: string): UseClientBrandingResult {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const resolveBrandingForCompany = async (companyId: string): Promise<BrandingConfig | null> => {
      // Check if whitelabel_branding module is enabled
      const { data: moduleAccess, error: maError } = await supabase
        .from('company_module_access')
        .select('enabled')
        .eq('company_id', companyId)
        .eq('module_id', 'whitelabel_branding')
        .maybeSingle();

      if (maError || !moduleAccess?.enabled) return null;

      // Read branding from company settings
      const { data: company, error: compError } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (compError || !company) return null;

      const settings = company.settings as Record<string, any> | null;
      if (settings?.branding?.enabled) {
        return settings.branding as BrandingConfig;
      }
      return null;
    };

    const resolve = async () => {
      try {
        // 1. Try resolving via client_portal_access (client → subscriber → company)
        const { data: access } = await supabase
          .from('client_portal_access')
          .select('subscriber_user_id')
          .eq('client_user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (access?.subscriber_user_id) {
          const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', access.subscriber_user_id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

          if (companyUser?.company_id) {
            const result = await resolveBrandingForCompany(companyUser.company_id);
            if (result) {
              setBranding(result);
              return;
            }
          }
        }

        // 2. Fallback: if admin is viewing, try resolving via admin's own company
        if (adminUserId && adminUserId !== userId) {
          const { data: adminCompany } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', adminUserId)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

          if (adminCompany?.company_id) {
            const result = await resolveBrandingForCompany(adminCompany.company_id);
            if (result) {
              setBranding(result);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error resolving client branding:', err);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [userId, adminUserId]);

  return { branding, loading };
}
