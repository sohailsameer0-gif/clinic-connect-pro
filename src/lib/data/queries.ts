/**
 * Thin data-access layer over Supabase. Modular so a future Firebase swap
 * only touches these helpers. UI hooks call these instead of supabase directly.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function searchClinics(params: { q?: string; city?: string; specialty?: string }) {
  let query = supabase.from("clinics").select("*").eq("status", "approved").order("featured", { ascending: false }).order("rating", { ascending: false });
  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  const { data, error } = await query.limit(60);
  if (error) throw error;
  let result = data ?? [];
  if (params.specialty) {
    const { data: docs } = await supabase.from("doctors").select("clinic_id").ilike("specialty", `%${params.specialty}%`).eq("active", true);
    const ids = new Set((docs ?? []).map((d) => d.clinic_id));
    result = result.filter((c) => ids.has(c.id));
  }
  return result;
}

export async function getClinicBySlug(slug: string) {
  const { data, error } = await supabase.from("clinics").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDoctorsByClinic(clinicId: string) {
  const { data, error } = await supabase.from("doctors").select("*").eq("clinic_id", clinicId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getServicesByClinic(clinicId: string) {
  const { data, error } = await supabase.from("services").select("*").eq("clinic_id", clinicId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getSchedulesForDoctor(doctorId: string) {
  const { data, error } = await supabase.from("schedules").select("*").eq("doctor_id", doctorId).eq("active", true);
  if (error) throw error;
  return data ?? [];
}

export async function getBookedRanges(doctorId: string, fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("doctor_id", doctorId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .in("status", ["pending", "confirmed", "rescheduled"]);
  if (error) throw error;
  return data ?? [];
}

export async function getReviewsForClinic(clinicId: string) {
  const { data, error } = await supabase.from("reviews").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getMyClinic() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("clinics").select("*").eq("owner_id", u.user.id).maybeSingle();
  if (error) throw error;
  return data;
}
