import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMyClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Calendar, Stethoscope, Users2, Star } from "lucide-react";

export const Route = createFileRoute("/clinic/")({ component: ClinicOverview });

function ClinicOverview() {
  const { user } = useAuth();
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic, enabled: !!user });

  const { data: stats, refetch } = useQuery({
    queryKey: ["clinic-stats", clinic?.id],
    enabled: !!clinic,
    queryFn: async () => {
      const cid = clinic!.id;
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
      const [doctors, services, todays, pending] = await Promise.all([
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("clinic_id", cid),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("clinic_id", cid),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", cid).gte("starts_at", today.toISOString()).lt("starts_at", tomorrow.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", cid).eq("status", "pending"),
      ]);
      return { doctors: doctors.count ?? 0, services: services.count ?? 0, today: todays.count ?? 0, pending: pending.count ?? 0 };
    },
  });

  useEffect(() => {
    if (!clinic) return;
    const ch = supabase.channel("clinic-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinic.id}` }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [clinic, refetch]);

  const cards = [
    { label: "Today's appointments", value: stats?.today ?? 0, icon: Calendar },
    { label: "Pending requests", value: stats?.pending ?? 0, icon: Star },
    { label: "Doctors", value: stats?.doctors ?? 0, icon: Stethoscope },
    { label: "Services", value: stats?.services ?? 0, icon: Users2 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Today at a glance for {clinic?.name}.</p>
      {clinic?.status !== "approved" && (
        <Card className="mt-4 border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
          Your clinic is currently <span className="font-semibold">{clinic?.status}</span>. Listings are visible to patients only after approval.
        </Card>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} className="bg-gradient-card p-5 shadow-soft">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
