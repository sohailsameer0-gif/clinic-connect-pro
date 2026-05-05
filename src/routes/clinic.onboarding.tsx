import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Stethoscope, HeartPulse, Building2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { clinicSchema, type ClinicInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/onboarding")({ component: Onboarding });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `clinic-${Date.now()}`;
}

const TYPES = [
  { v: "dental", icon: Stethoscope, label: "Dental Clinic", sub: "Dentists & oral care" },
  { v: "general", icon: HeartPulse, label: "General / Medical", sub: "GPs & specialists" },
  { v: "multi", icon: Building2, label: "Multi-Specialty", sub: "Both dental & medical" },
] as const;

function Onboarding() {
  const { user, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const form = useForm<ClinicInput>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: "", clinic_type: "general", tagline: "", about: "",
      address: "", city: "", phone: "", whatsapp: "", email: "", website: "",
      logo_url: "", banner_url: "",
    },
  });
  const clinicType = form.watch("clinic_type");

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const onSubmit = async (v: ClinicInput) => {
    setSaving(true);
    const { error } = await supabase.from("clinics").insert({
      owner_id: user.id,
      name: v.name,
      clinic_type: v.clinic_type,
      slug: slugify(v.name) + "-" + Math.random().toString(36).slice(2, 6),
      tagline: v.tagline || null,
      about: v.about || null,
      address: v.address || null,
      city: v.city || null,
      phone: v.phone || null,
      whatsapp: v.whatsapp || null,
      email: v.email || null,
      website: v.website || null,
      logo_url: v.logo_url || null,
      banner_url: v.banner_url || null,
      status: "pending",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    toast.success("Clinic submitted! We'll review it shortly.");
    navigate({ to: "/clinic" });
  };

  return (
    <main className="container mx-auto flex-1 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">List your clinic</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about your practice. You can edit details and add doctors, services, and schedules after approval.</p>
        <Card className="mt-6 p-6 shadow-soft">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type */}
            <div>
              <Label>Clinic type *</Label>
              <Controller
                control={form.control}
                name="clinic_type"
                render={({ field }) => (
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {TYPES.map((t) => (
                      <button
                        key={t.v}
                        type="button"
                        onClick={() => field.onChange(t.v)}
                        className={`rounded-xl border p-4 text-left transition ${
                          clinicType === t.v ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <t.icon className={`h-5 w-5 ${clinicType === t.v ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="mt-2 text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.sub}</p>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Brand */}
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <Label>Logo</Label>
                <Controller
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <div className="mt-2">
                      <ImageUpload bucket="clinic-logos" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} label="Upload logo" />
                    </div>
                  )}
                />
              </div>
              <div>
                <Label>Cover banner</Label>
                <Controller
                  control={form.control}
                  name="banner_url"
                  render={({ field }) => (
                    <div className="mt-2">
                      <ImageUpload bucket="clinic-banners" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} label="Upload banner (3:1)" aspect="wide" />
                    </div>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Clinic name *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" placeholder="Caring smiles, every day" {...form.register("tagline")} />
            </div>
            <div>
              <Label htmlFor="about">About</Label>
              <Textarea id="about" rows={4} {...form.register("about")} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...form.register("whatsapp")} />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://" {...form.register("website")} />
              {form.formState.errors.website && <p className="mt-1 text-xs text-destructive">{form.formState.errors.website.message}</p>}
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for review
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
