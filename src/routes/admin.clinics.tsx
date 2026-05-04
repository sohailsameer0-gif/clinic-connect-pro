import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Star, Trash2, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["clinic_status"];

export const Route = createFileRoute("/admin/clinics")({ component: AdminClinics });

function AdminClinics() {
  const [tab, setTab] = useState<Status | "all">("pending");
  const [q, setQ] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-clinics", tab, q],
    queryFn: async () => {
      let query = supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (tab !== "all") query = query.eq("status", tab);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-clinics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "clinics" }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [refetch]);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("clinics").update({ status, verified: status === "approved" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Clinic ${status}`);
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    const { error } = await supabase.from("clinics").update({ featured: !featured }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(featured ? "Unfeatured" : "Featured");
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("clinics").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Clinic deleted");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approve, reject, feature, or remove clinics.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-9 w-64" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status | "all")} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-soft">No clinics in this view.</Card>
        )}
        {(data ?? []).map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 shadow-soft">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{c.name}</h3>
                {c.featured && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                  c.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                  c.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{c.status}</span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {c.city ?? "—"} · {c.email ?? "no email"} · {c.phone ?? "no phone"} · /{c.slug}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.status !== "approved" && (
                <Button size="sm" onClick={() => setStatus(c.id, "approved")}>
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
              )}
              {c.status !== "rejected" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "rejected")}>
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
              )}
              {c.status === "approved" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "suspended")}>Suspend</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => toggleFeatured(c.id, c.featured)}>
                <Star className={`mr-1 h-4 w-4 ${c.featured ? "fill-amber-400 text-amber-500" : ""}`} />
                {c.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(c.id, c.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
