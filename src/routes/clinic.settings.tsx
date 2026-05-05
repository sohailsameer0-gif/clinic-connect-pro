import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stethoscope, HeartPulse, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { clinicSchema, type ClinicInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/settings")({ component: ClinicSettings });

const TYPES = [
  { v: "dental", icon: Stethoscope, label: "Dental" },
  { v: "general", icon: HeartPulse, label: "General" },
  { v: "multi", icon: Building2, label: "Multi" },
] as const;

function ClinicSettings() {
  const { data: clinic, refetch } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const form = useForm<ClinicInput>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { name: "", clinic_type: "general", tagline: "", about: "", address: "", city: "", phone: "", email: "", website: "", whatsapp: "", logo_url: "", banner_url: "" },
  });
  const ct = form.watch("clinic_type");

  useEffect(() => {
    if (clinic) form.reset({
      name: clinic.name,
      clinic_type: (clinic.clinic_type as "dental" | "general" | "multi" | undefined) ?? "general",
      tagline: clinic.tagline ?? "", about: clinic.about ?? "",
      address: clinic.address ?? "", city: clinic.city ?? "", phone: clinic.phone ?? "",
      email: clinic.email ?? "", website: clinic.website ?? "", whatsapp: clinic.whatsapp ?? "",
      logo_url: clinic.logo_url ?? "", banner_url: clinic.banner_url ?? "",
    });
  }, [clinic, form]);

  const submit = async (v: ClinicInput) => {
    if (!clinic) return;
    const { error } = await supabase.from("clinics").update({
      name: v.name, clinic_type: v.clinic_type,
      tagline: v.tagline || null, about: v.about || null,
      address: v.address || null, city: v.city || null, phone: v.phone || null,
      email: v.email || null, website: v.website || null, whatsapp: v.whatsapp || null,
      logo_url: v.logo_url || null, banner_url: v.banner_url || null,
    }).eq("id", clinic.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Card className="mt-6 max-w-3xl p-6 shadow-soft">
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <div>
            <Label>Clinic type</Label>
            <Controller
              control={form.control}
              name="clinic_type"
              render={({ field }) => (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => field.onChange(t.v)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        ct === t.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <Label>Logo</Label>
              <Controller
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <div className="mt-2"><ImageUpload bucket="clinic-logos" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} /></div>
                )}
              />
            </div>
            <div>
              <Label>Cover banner</Label>
              <Controller
                control={form.control}
                name="banner_url"
                render={({ field }) => (
                  <div className="mt-2"><ImageUpload bucket="clinic-banners" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} aspect="wide" /></div>
                )}
              />
            </div>
          </div>

          <div><Label>Name</Label><Input {...form.register("name")} /></div>
          <div><Label>Tagline</Label><Input {...form.register("tagline")} /></div>
          <div><Label>About</Label><Textarea rows={4} {...form.register("about")} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>City</Label><Input {...form.register("city")} /></div>
            <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
          </div>
          <div><Label>Address</Label><Input {...form.register("address")} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Email</Label><Input {...form.register("email")} /></div>
            <div><Label>Website</Label><Input {...form.register("website")} /></div>
          </div>
          <div><Label>WhatsApp</Label><Input {...form.register("whatsapp")} /></div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
