import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Stethoscope } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/booking/slots";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/patient/")({ component: PatientOverview });

function PatientOverview() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["patient-appts-upcoming", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, starts_at, status, doctor_id, clinic_id, doctors(name, specialty), clinics(name, slug, city)")
        .eq("patient_id", user!.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("patient-appts")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, refetch]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your appointments and care, all in one place.</p>
        </div>
        <Button asChild><Link to="/search">Find care</Link></Button>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Upcoming appointments</h2>
      {isLoading ? (
        <div className="mt-3 h-32 animate-pulse rounded-xl bg-muted/40" />
      ) : !data || data.length === 0 ? (
        <Card className="mt-3 p-8 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">No upcoming appointments yet.</p>
          <Button className="mt-4" asChild><Link to="/search">Browse clinics</Link></Button>
        </Card>
      ) : (
        <div className="mt-3 grid gap-3">
          {data.map((a) => {
            const d = new Date(a.starts_at);
            return (
              <Card key={a.id} className="flex flex-col gap-3 p-4 shadow-soft md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Stethoscope className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">{(a.doctors as { name?: string } | null)?.name ?? "Doctor"} · <span className="text-muted-foreground">{(a.doctors as { specialty?: string } | null)?.specialty}</span></p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />{(a.clinics as { name?: string } | null)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" />{d.toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
