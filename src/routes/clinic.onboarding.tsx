import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { clinicSchema, type ClinicInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/onboarding")({ component: Onboarding });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `clinic-${Date.now()}`;
}

function Onboarding() {
  const { user, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const form = useForm<ClinicInput>({ resolver: zodResolver(clinicSchema), defaultValues: { name: "", tagline: "", about: "", address: "", city: "", phone: "", email: "" } });

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const onSubmit = async (v: ClinicInput) => {
    setSaving(true);
    const { error } = await supabase.from("clinics").insert({
      owner_id: user.id,
      name: v.name,
      slug: slugify(v.name) + "-" + Math.random().toString(36).slice(2, 6),
      tagline: v.tagline || null,
      about: v.about || null,
      address: v.address || null,
      city: v.city || null,
      phone: v.phone || null,
      email: v.email || null,
      status: "pending",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    toast.success("Clinic submitted! We'll review it shortly.");
    navigate({ to: "/clinic" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">List your clinic</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tell us about your practice. You can edit details later.</p>
          <Card className="mt-6 p-6 shadow-soft">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for review
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
