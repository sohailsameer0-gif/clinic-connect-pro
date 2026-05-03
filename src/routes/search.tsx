import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, MapPin, Star, Stethoscope } from "lucide-react";
import { searchClinics } from "@/lib/data/queries";
import { z } from "zod";

const searchParams = z.object({ q: z.string().optional(), city: z.string().optional(), specialty: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchParams.parse(s),
  head: () => ({ meta: [{ title: "Search clinics & doctors — MediBook" }] }),
  component: SearchPage,
});

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-20">
        <Card className="max-w-md p-10 text-center shadow-elegant">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const initial = Route.useSearch();
  const [q, setQ] = useState(initial.q ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [specialty, setSpecialty] = useState(initial.specialty ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["search-clinics", initial.q, initial.city, initial.specialty],
    queryFn: () => searchClinics({ q: initial.q, city: initial.city, specialty: initial.specialty }),
  });

  const apply = () => navigate({ to: "/search", search: { q: q || undefined, city: city || undefined, specialty: specialty || undefined } });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border/60 bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <Card className="flex flex-col gap-2 p-2 shadow-soft md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 px-3">
                <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input placeholder="Clinic name" value={q} onChange={(e) => setQ(e.target.value)} className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </div>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-3">
                <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input placeholder="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </div>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </div>
              <Button onClick={apply}>Search</Button>
            </Card>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight">{isLoading ? "Searching…" : `${data?.length ?? 0} clinics found`}</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/40" />)
            ) : (data ?? []).length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground shadow-soft md:col-span-2 lg:col-span-3">
                No clinics matched your search. Try a different city or specialty.
              </Card>
            ) : (
              (data ?? []).map((c) => (
                <Link key={c.id} to="/c/$slug" params={{ slug: c.slug }}>
                  <Card className="bg-gradient-card h-full overflow-hidden p-0 shadow-soft transition hover:shadow-elegant">
                    <div className="relative h-32 bg-gradient-hero opacity-90">
                      {c.banner_url && <img src={c.banner_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{c.name}</h3>
                        {c.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Featured</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.tagline ?? c.about?.slice(0, 80)}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city ?? "—"}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{c.rating} ({c.review_count})</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
