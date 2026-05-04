import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, clinics(name, slug), doctors(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-reviews-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [refetch]);

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">Moderate patient reviews across the platform.</p>

      <div className="mt-6 grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-soft">No reviews yet.</Card>
        )}
        {(data ?? []).map((r: any) => (
          <Card key={r.id} className="p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{r.clinics?.name ?? "Unknown clinic"}</span>
                  {r.doctors?.name && <span className="text-xs text-muted-foreground">· Dr. {r.doctors.name}</span>}
                </div>
                {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
                {r.reply && (
                  <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
                    <span className="font-medium">Clinic reply: </span>{r.reply}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
