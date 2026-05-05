import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic, getServicesByClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceInput } from "@/lib/validation/schemas";
import { templatesFor } from "@/lib/data/serviceTemplates";
import { ImageUpload } from "@/components/ImageUpload";

const serviceFormSchema = serviceSchema.extend({});
type ServiceFormInput = ServiceInput & { image_url?: string };

export const Route = createFileRoute("/clinic/services")({ component: ClinicServices });

function ClinicServices() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: services = [], refetch } = useQuery({
    queryKey: ["clinic-services-mgmt", clinic?.id], enabled: !!clinic,
    queryFn: () => getServicesByClinic(clinic!.id),
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };
  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active }).eq("id", id); refetch();
  };

  const seedTemplates = async () => {
    if (!clinic) return;
    setSeeding(true);
    const tmpl = templatesFor(clinic.clinic_type);
    const existingNames = new Set(services.map((s) => s.name.toLowerCase()));
    const rows = tmpl
      .filter((t) => !existingNames.has(t.name.toLowerCase()))
      .map((t) => ({
        clinic_id: clinic.id,
        name: t.name,
        category: t.category,
        price: t.price,
        duration_min: t.duration_min,
        description: t.description ?? null,
      }));
    if (rows.length === 0) {
      setSeeding(false);
      toast.info("All template services already exist.");
      return;
    }
    const { error } = await supabase.from("services").insert(rows);
    setSeeding(false);
    if (error) return toast.error(error.message);
    toast.success(`Added ${rows.length} services from the ${clinic.clinic_type} template`);
    refetch();
  };

  const editingService = editing ? services.find((s) => s.id === editing) ?? null : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          {clinic && (
            <p className="mt-1 text-xs text-muted-foreground">
              Type: <span className="font-medium capitalize">{clinic.clinic_type}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedTemplates} disabled={seeding || !clinic}>
            <Sparkles className="mr-1 h-4 w-4" />
            {seeding ? "Adding…" : `Add ${clinic?.clinic_type === "dental" ? "dental" : clinic?.clinic_type === "multi" ? "all" : "general"} templates`}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Add service</Button></DialogTrigger>
            <SvcDialog clinicId={clinic?.id} editing={editingService} onSaved={() => { setOpen(false); setEditing(null); refetch(); }} />
          </Dialog>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {services.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground md:col-span-2">
            No services yet. Use a template to get started fast, or add manually.
          </Card>
        ) : services.map((s) => (
          <Card key={s.id} className="overflow-hidden p-0 shadow-soft">
            <div className="flex">
              {s.image_url && <img src={s.image_url} alt="" className="h-24 w-24 flex-shrink-0 object-cover" />}
              <div className="flex flex-1 items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.category} · {s.duration_min} min · ${Number(s.price).toFixed(0)}</p>
                  {s.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Switch checked={s.active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(s.id); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SvcDialog({ clinicId, editing, onSaved }: { clinicId?: string; editing: { id: string; name: string; category: string; description: string | null; price: number; duration_min: number; image_url?: string | null } | null; onSaved: () => void }) {
  const form = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: editing
      ? { name: editing.name, category: editing.category, description: editing.description ?? "", price: Number(editing.price), duration_min: editing.duration_min, image_url: editing.image_url ?? "" }
      : { name: "", category: "general", description: "", price: 0, duration_min: 30, image_url: "" },
  });
  const submit = async (v: ServiceFormInput) => {
    if (!clinicId) return;
    const payload = {
      clinic_id: clinicId,
      name: v.name,
      category: v.category,
      description: v.description || null,
      price: v.price,
      duration_min: v.duration_min,
      image_url: v.image_url || null,
    };
    const res = editing ? await supabase.from("services").update(payload).eq("id", editing.id) : await supabase.from("services").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
        <Controller
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <div>
              <Label>Image (optional)</Label>
              <div className="mt-2">
                <ImageUpload bucket="service-images" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} />
              </div>
            </div>
          )}
        />
        <div><Label>Name</Label><Input {...form.register("name")} /></div>
        <div><Label>Category</Label><Input {...form.register("category")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price ($)</Label><Input type="number" step="0.01" {...form.register("price")} /></div>
          <div><Label>Duration (min)</Label><Input type="number" {...form.register("duration_min")} /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={3} {...form.register("description")} /></div>
        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
