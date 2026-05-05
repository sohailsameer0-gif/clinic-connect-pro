import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the best post-auth route for a given user based on their roles.
 * Priority: super_admin → /admin, clinic_owner|clinic_staff → /clinic, otherwise /patient.
 */
export async function resolvePostAuthPath(userId: string): Promise<string> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (roles.includes("super_admin")) return "/admin";
  if (roles.includes("clinic_owner") || roles.includes("clinic_staff")) {
    // If they're a clinic user but have no clinic yet, send them to onboarding
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    return clinic ? "/clinic" : "/clinic/onboarding";
  }
  return "/patient";
}
