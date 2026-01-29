import { supabase } from "@/integrations/supabase/client";

export type CompanySummary = {
  id: string;
  name: string;
  display_name: string;
  company_type: string | null;
  parent_company_id: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
};

export type ActiveCompanyMembership = {
  company_id: string;
  companies: CompanySummary | null;
};

export async function fetchActiveCompanyMemberships(userId: string): Promise<ActiveCompanyMembership[]> {
  const { data, error } = await supabase
    .from("company_users")
    .select(
      `
        company_id,
        companies (
          id,
          name,
          display_name,
          company_type,
          parent_company_id,
          subscription_tier,
          subscription_status
        )
      `
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;
  return (data ?? []) as unknown as ActiveCompanyMembership[];
}

export function isInternalEnterpriseMembership(memberships: ActiveCompanyMembership[]): boolean {
  return memberships.some(
    (m) => (m.companies as any)?.subscription_tier === "enterprise_internal"
  );
}

// Heuristic: pick the most privileged/likely "primary" company when a user belongs to multiple.
export function pickPrimaryCompany(memberships: ActiveCompanyMembership[]): CompanySummary | null {
  if (!memberships.length) return null;

  const scored = memberships
    .map((m) => {
      const c = m.companies as any;
      const tier = String(c?.subscription_tier ?? "");
      const type = String(c?.company_type ?? "");

      let score = 0;
      if (tier === "enterprise_internal") score += 100;
      if (type === "publishing_firm") score += 50;
      if (tier === "enterprise") score += 25;
      if (tier === "pro") score += 10;

      return { company: m.companies ?? null, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.company ?? null;
}
