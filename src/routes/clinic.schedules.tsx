import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic, getDoctorsByClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { WEEKDAYS_LONG } from "@/lib/booking/slots";

export const Route = createFileRoute("/clinic/schedules")({ component: ClinicSchedules });

function ClinicSchedules() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: doctors = [] } = useQuery({ queryKey: ["clinic-doctors-mgmt", clinic?.id], queryFn: () => getDoctorsByClinic(clinic!.id), enabled: !!clinic });
  const [doctorId, setDoctorId] = useState<string>("");

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["doctor-schedules-mgmt", doctorId], enabled: !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*").eq("doctor_id", doctorId).order("weekday");
      if (error) throw error; return data ?? [];
    },
  });

  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [slotMin, setSlotMin] = useState("30");

  const add = async () => {
    if (!doctorId) return;
    const { error } = await supabase.from("schedules").insert({
      doctor_id: doctorId, weekday: Number(weekday), start_time: start, end_time: end,
      slot_minutes: Number(slotMin), max_per_slot: 1, buffer_min: 0, active: true,
    });
    if (error) return toast.error(error.message);
    refetch();
  };
  const del = async (id: string) => {
    await supabase.from("schedules").delete().eq("id", id); refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
      <Card className="mt-6 p-4 shadow-soft">
        <Label>Doctor</Label>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a doctor" /></SelectTrigger>
          <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      {doctorId && (
        <>
          <Card className="mt-4 p-4 shadow-soft">
            <h2 className="font-semibold">Add weekly slot</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div><Label>Day</Label>
                <Select value={weekday} onValueChange={setWeekday}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WEEKDAYS_LONG.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Start</Label><Input type="time" value={start} onChange={e=>setStart(e.target.value)} /></div>
              <div><Label>End</Label><Input type="time" value={end} onChange={e=>setEnd(e.target.value)} /></div>
              <div><Label>Slot (min)</Label><Input type="number" value={slotMin} onChange={e=>setSlotMin(e.target.value)} /></div>
              <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="mr-1 h-4 w-4" />Add</Button></div>
            </div>
          </Card>

          <div className="mt-4 grid gap-2">
            {schedules.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">No schedule entries.</Card> : schedules.map(s => (
              <Card key={s.id} className="flex items-center justify-between p-3 shadow-soft">
                <p className="text-sm">{WEEKDAYS_LONG[s.weekday]} · {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)} · {s.slot_minutes}min</p>
                <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
