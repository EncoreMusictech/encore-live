import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface BrandingResult {
  logoUrl?: string;
  brandName?: string;
  accentColor?: string;
  primaryColor?: string;
  headerBgColor?: string;
}

/** Convert HSL string like "220 90% 56%" to hex for email use */
function hslToHex(hslStr: string): string | undefined {
  if (!hslStr) return undefined;
  const parts = hslStr.trim().split(/\s+/);
  if (parts.length < 3) return undefined;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
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
      const colors = settings.branding.colors || {};
      return {
        logoUrl: settings.branding.logo_url,
        brandName: settings.branding.display_name || undefined,
        primaryColor: hslToHex(colors.primary),
        accentColor: hslToHex(colors.accent),
        headerBgColor: hslToHex(colors.headerBg),
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
