import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic, getDoctorsByClinic } from "@/lib/data/queries";
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
import { doctorSchema, type DoctorInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/clinic/doctors")({ component: ClinicDoctors });

function ClinicDoctors() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: doctors = [], refetch } = useQuery({
    queryKey: ["clinic-doctors-mgmt", clinic?.id],
    enabled: !!clinic,
    queryFn: () => getDoctorsByClinic(clinic!.id),
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };
  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("doctors").update({ active }).eq("id", id);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Add doctor</Button></DialogTrigger>
          <DoctorDialog clinicId={clinic?.id} editing={editing ? doctors.find(d => d.id === editing) ?? null : null} onSaved={() => { setOpen(false); setEditing(null); refetch(); }} />
        </Dialog>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {doctors.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground md:col-span-2">No doctors yet.</Card>
        ) : doctors.map(d => (
          <Card key={d.id} className="p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.specialty} · {d.experience_years}y · ${Number(d.fee).toFixed(0)}</p>
                {d.qualification && <p className="text-xs text-muted-foreground">{d.qualification}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={d.active} onCheckedChange={(v) => toggleActive(d.id, v)} />
                <Button size="icon" variant="ghost" onClick={() => { setEditing(d.id); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DoctorDialog({ clinicId, editing, onSaved }: { clinicId?: string; editing: { id: string; name: string; specialty: string; qualification: string | null; experience_years: number; fee: number; bio: string | null; image_url: string | null; active: boolean } | null; onSaved: () => void }) {
  const form = useForm<DoctorInput>({
    resolver: zodResolver(doctorSchema),
    defaultValues: editing ? {
      name: editing.name, specialty: editing.specialty, qualification: editing.qualification ?? "",
      experience_years: editing.experience_years, fee: Number(editing.fee), bio: editing.bio ?? "",
      image_url: editing.image_url ?? "", active: editing.active,
    } : { name: "", specialty: "", qualification: "", experience_years: 0, fee: 0, bio: "", image_url: "", active: true },
  });
  const submit = async (v: DoctorInput) => {
    if (!clinicId) return;
    const payload = {
      clinic_id: clinicId, name: v.name, specialty: v.specialty,
      qualification: v.qualification || null, experience_years: v.experience_years,
      fee: v.fee, bio: v.bio || null, image_url: v.image_url || null,
      active: v.active ?? true,
    };
    const res = editing ? await supabase.from("doctors").update(payload).eq("id", editing.id) : await supabase.from("doctors").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Edit doctor" : "Add doctor"}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
        <div><Label>Name</Label><Input {...form.register("name")} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
        <div><Label>Specialty</Label><Input {...form.register("specialty")} /></div>
        <div><Label>Qualification</Label><Input {...form.register("qualification")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Experience (years)</Label><Input type="number" {...form.register("experience_years")} /></div>
          <div><Label>Fee ($)</Label><Input type="number" step="0.01" {...form.register("fee")} /></div>
        </div>
        <div><Label>Bio</Label><Textarea rows={3} {...form.register("bio")} /></div>
        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
