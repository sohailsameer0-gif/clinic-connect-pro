import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { clinicSchema, type ClinicInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/settings")({ component: ClinicSettings });

function ClinicSettings() {
  const { data: clinic, refetch } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const form = useForm<ClinicInput>({ resolver: zodResolver(clinicSchema), defaultValues: { name: "", tagline: "", about: "", address: "", city: "", phone: "", email: "", website: "", whatsapp: "" } });

  useEffect(() => {
    if (clinic) form.reset({
      name: clinic.name, tagline: clinic.tagline ?? "", about: clinic.about ?? "",
      address: clinic.address ?? "", city: clinic.city ?? "", phone: clinic.phone ?? "",
      email: clinic.email ?? "", website: clinic.website ?? "", whatsapp: clinic.whatsapp ?? "",
    });
  }, [clinic, form]);

  const submit = async (v: ClinicInput) => {
    if (!clinic) return;
    const { error } = await supabase.from("clinics").update({
      name: v.name, tagline: v.tagline || null, about: v.about || null,
      address: v.address || null, city: v.city || null, phone: v.phone || null,
      email: v.email || null, website: v.website || null, whatsapp: v.whatsapp || null,
    }).eq("id", clinic.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Card className="mt-6 max-w-2xl p-6 shadow-soft">
        <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
          <div><Label>Name</Label><Input {...form.register("name")} /></div>
          <div><Label>Tagline</Label><Input {...form.register("tagline")} /></div>
          <div><Label>About</Label><Textarea rows={4} {...form.register("about")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input {...form.register("city")} /></div>
            <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
          </div>
          <div><Label>Address</Label><Input {...form.register("address")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input {...form.register("email")} /></div>
            <div><Label>Website</Label><Input {...form.register("website")} /></div>
          </div>
          <div><Label>WhatsApp</Label><Input {...form.register("whatsapp")} /></div>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
