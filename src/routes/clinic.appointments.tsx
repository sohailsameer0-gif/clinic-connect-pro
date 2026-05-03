import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/booking/slots";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["appointment_status"];

export const Route = createFileRoute("/clinic/appointments")({ component: ClinicAppointments });

function ClinicAppointments() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const [tab, setTab] = useState<"pending" | "upcoming" | "past">("pending");

  const { data, refetch } = useQuery({
    queryKey: ["clinic-appts", clinic?.id, tab],
    enabled: !!clinic,
    queryFn: async () => {
      const now = new Date().toISOString();
      let q = supabase.from("appointments").select("*, doctors(name, specialty)").eq("clinic_id", clinic!.id);
      if (tab === "pending") q = q.eq("status", "pending").order("starts_at");
      else if (tab === "upcoming") q = q.gte("starts_at", now).in("status", ["confirmed", "rescheduled"]).order("starts_at");
      else q = q.lt("starts_at", now).order("starts_at", { ascending: false });
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!clinic) return;
    const ch = supabase.channel("clinic-appts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinic.id}` }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [clinic, refetch]);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 grid gap-3">
          {!data || data.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Nothing here.</Card>
          ) : data.map((a) => {
            const d = new Date(a.starts_at);
            return (
              <Card key={a.id} className="p-4 shadow-soft">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{a.patient_name ?? "Patient"} · {(a.doctors as { name?: string } | null)?.name}</p>
                    <p className="text-xs text-muted-foreground">{(a.doctors as { specialty?: string } | null)?.specialty} · {d.toLocaleString()}</p>
                    {a.notes && <p className="mt-1 text-xs text-muted-foreground">"{a.notes}"</p>}
                    {(a.patient_email || a.patient_phone) && (
                      <p className="mt-1 text-xs text-muted-foreground">{a.patient_email}{a.patient_phone ? ` · ${a.patient_phone}` : ""}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</Badge>
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => setStatus(a.id, "confirmed")}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>
                      </>
                    )}
                    {(a.status === "confirmed" || a.status === "rescheduled") && (
                      <>
                        <Button size="sm" onClick={() => setStatus(a.id, "completed")}>Complete</Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "no_show")}>No-show</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, "cancelled")}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
