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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/services")({ component: ClinicServices });

function ClinicServices() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: services = [], refetch } = useQuery({
    queryKey: ["clinic-services-mgmt", clinic?.id], enabled: !!clinic,
    queryFn: () => getServicesByClinic(clinic!.id),
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };
  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active }).eq("id", id); refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Add service</Button></DialogTrigger>
          <SvcDialog clinicId={clinic?.id} editing={editing ? services.find(s => s.id === editing) ?? null : null} onSaved={() => { setOpen(false); setEditing(null); refetch(); }} />
        </Dialog>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {services.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground md:col-span-2">No services yet.</Card> : services.map(s => (
          <Card key={s.id} className="p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category} · {s.duration_min} min · ${Number(s.price).toFixed(0)}</p>
                {s.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={s.active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                <Button size="icon" variant="ghost" onClick={() => { setEditing(s.id); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SvcDialog({ clinicId, editing, onSaved }: { clinicId?: string; editing: { id: string; name: string; category: string; description: string | null; price: number; duration_min: number } | null; onSaved: () => void }) {
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: editing ? { name: editing.name, category: editing.category, description: editing.description ?? "", price: Number(editing.price), duration_min: editing.duration_min } : { name: "", category: "general", description: "", price: 0, duration_min: 30 },
  });
  const submit = async (v: ServiceInput) => {
    if (!clinicId) return;
    const payload = { clinic_id: clinicId, name: v.name, category: v.category, description: v.description || null, price: v.price, duration_min: v.duration_min };
    const res = editing ? await supabase.from("services").update(payload).eq("id", editing.id) : await supabase.from("services").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
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
