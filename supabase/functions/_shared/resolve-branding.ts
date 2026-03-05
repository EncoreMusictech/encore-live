import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface BrandingResult {
  logoUrl?: string;
  brandName?: string;
}

/**
 * Resolve whitelabel branding for a company by looking up its settings.
 * Falls back to empty (ENCORE defaults) if branding is not enabled.
 */
export async function resolveCompanyBranding(companyId: string): Promise<BrandingResult> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("companies")
      .select("settings")
      .eq("id", companyId)
      .single();

    if (error || !data) return {};

    const settings = data.settings as Record<string, any> | null;
    if (settings?.branding?.enabled && settings.branding.logo_url) {
      return {
        logoUrl: settings.branding.logo_url,
        brandName: settings.branding.display_name || undefined,
      };
    }

    return {};
  } catch (e) {
    console.error("resolveCompanyBranding error:", e);
    return {};
  }
}

/**
 * Resolve branding from a subscriber_user_id by finding their company.
 */
export async function resolveBrandingByUserId(userId: string): Promise<BrandingResult> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: membership } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!membership?.company_id) return {};
    return resolveCompanyBranding(membership.company_id);
  } catch (e) {
    console.error("resolveBrandingByUserId error:", e);
    return {};
  }
}
