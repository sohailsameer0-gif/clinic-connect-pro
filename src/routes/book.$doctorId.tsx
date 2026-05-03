import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSchedulesForDoctor, getBookedRanges, getServicesByClinic } from "@/lib/data/queries";
import { generateSlotsForDate, formatSlot, startOfDay, endOfDay } from "@/lib/booking/slots";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/book/$doctorId")({ component: BookPage });

function BookPage() {
  const { doctorId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: doctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*, clinics(id, name, slug)").eq("id", doctorId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["doctor-schedules", doctorId],
    queryFn: () => getSchedulesForDoctor(doctorId),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["doctor-services", doctor?.clinic_id],
    queryFn: () => getServicesByClinic(doctor!.clinic_id),
    enabled: !!doctor,
  });

  const { data: booked = [] } = useQuery({
    queryKey: ["booked", doctorId, date.toISOString()],
    queryFn: () => getBookedRanges(doctorId, startOfDay(date).toISOString(), endOfDay(date).toISOString()),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ["doctor-exc", doctorId, date.toDateString()],
    queryFn: async () => {
      const { data } = await supabase.from("schedule_exceptions").select("*").eq("doctor_id", doctorId).eq("date", date.toISOString().slice(0,10));
      return data ?? [];
    },
  });

  const slots = useMemo(() => generateSlotsForDate(date, schedules, booked, { holiday: exceptions.length > 0 }), [date, schedules, booked, exceptions]);

  const days = Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+i); return d; });

  const submit = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!selectedSlot || !doctor) return;
    setSubmitting(true);
    const svc = services.find(s => s.id === serviceId);
    const duration = svc?.duration_min ?? schedules[0]?.slot_minutes ?? 30;
    const ends = new Date(selectedSlot.getTime() + duration * 60_000);
    const { error } = await supabase.from("appointments").insert({
      clinic_id: doctor.clinic_id, doctor_id: doctor.id, patient_id: user.id,
      service_id: serviceId || null,
      starts_at: selectedSlot.toISOString(), ends_at: ends.toISOString(),
      patient_name: name, patient_email: email, patient_phone: phone || null,
      notes: notes || null, status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment requested! You'll be notified once confirmed.");
    navigate({ to: "/patient/appointments" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <Link to="/c/$slug" params={{ slug: (doctor?.clinics as { slug?: string } | null)?.slug ?? "" }} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to clinic
        </Link>
        {doctor && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Book with {doctor.name}</h1>
            <p className="text-sm text-muted-foreground">{doctor.specialty} · {(doctor.clinics as { name?: string } | null)?.name}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Select date</h2>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { const d=new Date(date); d.setDate(d.getDate()-1); if(d>=new Date(new Date().setHours(0,0,0,0))) setDate(d); }}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { const d=new Date(date); d.setDate(d.getDate()+1); setDate(d); }}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const active = d.toDateString() === date.toDateString();
                return (
                  <button key={d.toISOString()} onClick={() => { setDate(d); setSelectedSlot(null); }}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                    <span>{d.toLocaleDateString([], { weekday: "short" })}</span>
                    <span className="text-base font-semibold">{d.getDate()}</span>
                    <span className="text-[10px]">{d.toLocaleDateString([], { month: "short" })}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="mt-6 font-semibold">Available times</h3>
            {exceptions.length > 0 ? (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">Doctor is unavailable on this date.</p>
            ) : slots.length === 0 ? (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">No schedule for this day.</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4">
                {slots.map((s) => (
                  <button key={s.start.toISOString()} disabled={!s.available}
                    onClick={() => setSelectedSlot(s.start)}
                    className={`rounded-lg border px-2 py-2 text-sm transition ${
                      selectedSlot?.getTime() === s.start.getTime()
                        ? "border-primary bg-primary text-primary-foreground"
                        : s.available
                          ? "border-border hover:border-primary/50"
                          : "cursor-not-allowed border-border bg-muted/30 text-muted-foreground line-through"
                    }`}>
                    {formatSlot(s.start)}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="h-fit p-6 shadow-soft">
            <h2 className="font-semibold">Patient details</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Service (optional)</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger><SelectValue placeholder="General consultation" /></SelectTrigger>
                  <SelectContent>
                    {services.filter(s=>s.active).map(s => <SelectItem key={s.id} value={s.id}>{s.name} · ${Number(s.price).toFixed(0)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Full name</Label>
                <Input value={name} onChange={(e)=>setName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e)=>setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Reason for visit (optional)</Label>
                <Textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} />
              </div>
              {selectedSlot && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="font-medium">Selected: {selectedSlot.toLocaleDateString()} at {formatSlot(selectedSlot)}</p>
                </div>
              )}
              <Button className="w-full" onClick={submit} disabled={!selectedSlot || !name || !email || submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm booking
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
