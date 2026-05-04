import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Users2, Calendar, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [clinics, pending, users, appts, reviews] = await Promise.all([
        supabase.from("clinics").select("id", { count: "exact", head: true }),
        supabase.from("clinics").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);
      return {
        clinics: clinics.count ?? 0,
        pending: pending.count ?? 0,
        users: users.count ?? 0,
        appts: appts.count ?? 0,
        reviews: reviews.count ?? 0,
      };
    },
  });

  const { data: recentClinics } = useQuery({
    queryKey: ["admin-recent-clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("id, name, slug, status, created_at, city").order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-overview-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "clinics" }, () => refetch())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [refetch]);

  const cards = [
    { label: "Clinics", value: data?.clinics ?? 0, icon: Building2, to: "/admin/clinics" },
    { label: "Pending approval", value: data?.pending ?? 0, icon: Clock, to: "/admin/clinics", accent: true },
    { label: "Users", value: data?.users ?? 0, icon: Users2, to: "/admin/users" },
    { label: "Appointments", value: data?.appts ?? 0, icon: Calendar, to: "/admin/clinics" },
    { label: "Reviews", value: data?.reviews ?? 0, icon: Star, to: "/admin/reviews" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Platform overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Real-time stats across all clinics, users, and bookings.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className={`p-5 shadow-soft transition hover:shadow-elegant ${c.accent && c.value > 0 ? "ring-2 ring-primary/40" : ""}`}>
              <c.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-3xl font-semibold tracking-tight">{isLoading ? "—" : c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent clinics</h2>
          <Link to="/admin/clinics" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="grid gap-2">
          {(recentClinics ?? []).length === 0 && <p className="text-sm text-muted-foreground">No clinics yet.</p>}
          {(recentClinics ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.city ?? "—"} · {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                c.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                c.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                c.status === "rejected" ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
