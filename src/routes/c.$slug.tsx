import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Mail, Globe, Heart } from "lucide-react";
import { getClinicBySlug, getDoctorsByClinic, getServicesByClinic, getReviewsForClinic } from "@/lib/data/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$slug")({ component: ClinicDetail });

function ClinicDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: clinic, isLoading } = useQuery({
    queryKey: ["clinic", slug],
    queryFn: () => getClinicBySlug(slug),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["clinic-doctors", clinic?.id],
    queryFn: () => getDoctorsByClinic(clinic!.id),
    enabled: !!clinic,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["clinic-services", clinic?.id],
    queryFn: () => getServicesByClinic(clinic!.id),
    enabled: !!clinic,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["clinic-reviews", clinic?.id],
    queryFn: () => getReviewsForClinic(clinic!.id),
    enabled: !!clinic,
  });

  const [favId, setFavId] = useState<string | null>(null);
  useEffect(() => {
    if (!user || !clinic) return;
    void supabase.from("favorites").select("id").eq("user_id", user.id).eq("clinic_id", clinic.id).maybeSingle().then(({ data }) => setFavId(data?.id ?? null));
  }, [user, clinic]);

  const toggleFav = async () => {
    if (!user) return navigate({ to: "/login" });
    if (!clinic) return;
    if (favId) {
      await supabase.from("favorites").delete().eq("id", favId);
      setFavId(null);
    } else {
      const { data } = await supabase.from("favorites").insert({ user_id: user.id, clinic_id: clinic.id }).select("id").maybeSingle();
      setFavId(data?.id ?? null);
      toast.success("Added to favorites");
    }
  };

  if (isLoading) return <div className="flex min-h-screen flex-col"><Header /><main className="container mx-auto flex-1 px-4 py-20" /><Footer /></div>;
  if (!clinic) return (
    <div className="flex min-h-screen flex-col"><Header />
      <main className="container mx-auto flex-1 px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Clinic not found</h1>
        <Button asChild className="mt-4"><Link to="/search">Browse clinics</Link></Button>
      </main><Footer />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="relative h-56 overflow-hidden bg-gradient-hero">
          {clinic.banner_url && <img src={clinic.banner_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="container mx-auto px-4">
          <Card className="-mt-12 p-6 shadow-elegant">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{clinic.name}</h1>
                  {clinic.verified && <Badge variant="secondary">Verified</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{clinic.tagline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{clinic.rating} ({clinic.review_count})</span>
                  {clinic.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{clinic.city}</span>}
                  {clinic.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{clinic.phone}</span>}
                  {clinic.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{clinic.email}</span>}
                  {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground"><Globe className="h-3 w-3" />Website</a>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleFav}>
                  <Heart className={`mr-2 h-4 w-4 ${favId ? "fill-current text-destructive" : ""}`} />
                  {favId ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="doctors" className="my-8">
            <TabsList>
              <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
              <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="doctors" className="mt-4 grid gap-3 md:grid-cols-2">
              {doctors.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground md:col-span-2">No doctors listed yet.</Card>
              ) : doctors.filter((d) => d.active).map((d) => (
                <Card key={d.id} className="p-4 shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
                      {d.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.specialty} · {d.experience_years}y exp</p>
                      <p className="mt-1 text-xs">Fee: <span className="font-medium">${Number(d.fee).toFixed(0)}</span></p>
                    </div>
                    <Button size="sm" onClick={() => navigate({ to: "/book/$doctorId", params: { doctorId: d.id } })}>Book</Button>
                  </div>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="services" className="mt-4 grid gap-3 md:grid-cols-2">
              {services.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground md:col-span-2">No services listed yet.</Card>
              ) : services.filter(s => s.active).map((s) => (
                <Card key={s.id} className="p-4 shadow-soft">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.category} · {s.duration_min} min</p>
                  {s.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                  <p className="mt-2 text-sm font-medium">${Number(s.price).toFixed(0)}</p>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="about" className="mt-4">
              <Card className="p-6 shadow-soft">
                <p className="whitespace-pre-line text-sm text-muted-foreground">{clinic.about ?? "No description provided."}</p>
                {clinic.address && <p className="mt-4 text-sm"><MapPin className="mr-1 inline h-3 w-3" />{clinic.address}</p>}
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4 grid gap-3">
              {reviews.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">No reviews yet.</Card>
              ) : reviews.map((r) => (
                <Card key={r.id} className="p-4 shadow-soft">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                  {r.reply && <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs"><span className="font-medium">Clinic reply:</span> {r.reply}</p>}
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
