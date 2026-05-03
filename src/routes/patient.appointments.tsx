import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/booking/slots";
import { Calendar, Clock, Star } from "lucide-react";

export const Route = createFileRoute("/patient/appointments")({ component: PatientAppointments });

function PatientAppointments() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const { data, refetch } = useQuery({
    queryKey: ["patient-appts", user?.id, tab],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date().toISOString();
      let q = supabase
        .from("appointments")
        .select("*, doctors(name, specialty), clinics(name, slug)")
        .eq("patient_id", user!.id);
      q = tab === "upcoming" ? q.gte("starts_at", now).order("starts_at") : q.lt("starts_at", now).order("starts_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("patient-appts-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, refetch]);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Appointment cancelled");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 grid gap-3">
          {!data || data.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground shadow-soft">No appointments.</Card>
          ) : (
            data.map((a) => {
              const d = new Date(a.starts_at);
              const isUpcoming = tab === "upcoming";
              const canCancel = isUpcoming && ["pending", "confirmed", "rescheduled"].includes(a.status);
              const canReview = !isUpcoming && a.status === "completed";
              return (
                <Card key={a.id} className="p-4 shadow-soft">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{(a.doctors as { name?: string } | null)?.name ?? "Doctor"}</p>
                      <p className="text-xs text-muted-foreground">{(a.doctors as { specialty?: string } | null)?.specialty} · {(a.clinics as { name?: string } | null)?.name}</p>
                      <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{d.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</Badge>
                      {canCancel && <Button size="sm" variant="outline" onClick={() => cancel(a.id)}>Cancel</Button>}
                      {canReview && <ReviewDialog appointmentId={a.id} clinicId={a.clinic_id} doctorId={a.doctor_id} onDone={refetch} />}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewDialog({ appointmentId, clinicId, doctorId, onDone }: { appointmentId: string; clinicId: string; doctorId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("reviews").insert({
      appointment_id: appointmentId, clinic_id: clinicId, doctor_id: doctorId,
      patient_id: u.user!.id, rating, comment: comment || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    setOpen(false); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Star className="mr-1 h-3 w-3" /> Review</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Leave a review</DialogTitle></DialogHeader>
        <div>
          <Label>Rating</Label>
          <div className="mt-2 flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star className={`h-7 w-7 ${n<=rating?"fill-yellow-400 text-yellow-400":"text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Comment (optional)</Label>
          <Textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={4} />
        </div>
        <DialogFooter><Button onClick={submit} disabled={saving}>Submit</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
