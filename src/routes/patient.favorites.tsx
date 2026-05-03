import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/favorites")({ component: Favorites });

function Favorites() {
  const { user } = useAuth();
  const { data, refetch } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id, clinic_id, clinics(name, slug, city, tagline, rating, review_count)")
        .eq("user_id", user!.id)
        .not("clinic_id", "is", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">Saved clinics for quick rebooking.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {!data || data.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground shadow-soft md:col-span-2">
            <Heart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2">No favorites yet. Save clinics from search to find them here.</p>
            <Button className="mt-4" asChild><Link to="/search">Find clinics</Link></Button>
          </Card>
        ) : (
          data.map((f) => {
            const c = f.clinics as { name: string; slug: string; city: string | null; tagline: string | null; rating: number; review_count: number } | null;
            if (!c) return null;
            return (
              <Card key={f.id} className="p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to="/c/$slug" params={{ slug: c.slug }} className="font-semibold hover:underline">{c.name}</Link>
                    <p className="text-xs text-muted-foreground">{c.tagline ?? c.city}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{c.rating} ({c.review_count})</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>Remove</Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
