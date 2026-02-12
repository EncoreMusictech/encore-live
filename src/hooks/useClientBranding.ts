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

export function useClientBranding(userId: string | undefined): UseClientBrandingResult {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const resolve = async () => {
      try {
        // 1. Get subscriber_user_id from client_portal_access
        const { data: access, error: accessError } = await supabase
          .from('client_portal_access')
          .select('subscriber_user_id')
          .eq('client_user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (accessError || !access) {
          setLoading(false);
          return;
        }

        // 2. Get the subscriber's company_id
        const { data: companyUser, error: cuError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', access.subscriber_user_id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (cuError || !companyUser) {
          setLoading(false);
          return;
        }

        const companyId = companyUser.company_id;

        // 3. Check if whitelabel_branding module is enabled
        const { data: moduleAccess, error: maError } = await supabase
          .from('company_module_access')
          .select('enabled')
          .eq('company_id', companyId)
          .eq('module_id', 'whitelabel_branding')
          .maybeSingle();

        if (maError || !moduleAccess?.enabled) {
          setLoading(false);
          return;
        }

        // 4. Read branding from company settings
        const { data: company, error: compError } = await supabase
          .from('companies')
          .select('settings')
          .eq('id', companyId)
          .single();

        if (compError || !company) {
          setLoading(false);
          return;
        }

        const settings = company.settings as Record<string, any> | null;
        if (settings?.branding?.enabled) {
          setBranding(settings.branding as BrandingConfig);
        }
      } catch (err) {
        console.error('Error resolving client branding:', err);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [userId]);

  return { branding, loading };
}
