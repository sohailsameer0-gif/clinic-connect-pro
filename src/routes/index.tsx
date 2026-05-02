import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Calendar, Sparkles, Stethoscope, Star, ArrowRight, HeartPulse, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header, Footer } from "@/components/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediBook — Find & book trusted clinics and doctors" },
      { name: "description", content: "Discover verified dental and medical clinics, browse doctors, and book appointments instantly." },
    ],
  }),
  component: LandingPage,
});

const SPECIALTIES = ["Dentist", "General Physician", "Pediatrician", "Dermatologist", "Cardiologist", "Orthodontist"];

function LandingPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-soft" />
          <div className="absolute inset-x-0 top-0 -z-0 h-[520px] bg-gradient-hero opacity-[0.07]" />
          <div className="container relative mx-auto px-4 py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Trusted by clinics worldwide
              </span>
              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
                Healthcare, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">made effortless</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
                Find verified dentists and doctors near you. Book in seconds. Manage every visit in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mx-auto mt-10 max-w-3xl"
            >
              <Card className="bg-gradient-card flex flex-col gap-2 p-2 shadow-elegant md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Specialty, clinic, or doctor"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="hidden h-8 w-px bg-border md:block" />
                <div className="flex flex-1 items-center gap-2 px-3">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  size="lg"
                  className="shadow-glow"
                  onClick={() => navigate({ to: "/search", search: { q, city } as never })}
                >
                  Search <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Card>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Popular:</span>
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => navigate({ to: "/search", search: { q: s } as never })}
                    className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need, in one place</h2>
            <p className="mt-3 text-muted-foreground">Designed for patients and clinics. Built for trust.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified clinics", body: "Every clinic is reviewed and approved before going live on MediBook." },
              { icon: Calendar, title: "Real-time booking", body: "See live availability, pick a slot, and get instant confirmation." },
              { icon: HeartPulse, title: "All your care", body: "Manage appointments, medical history, and favorites in one dashboard." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="bg-gradient-card h-full p-6 shadow-soft transition hover:shadow-elegant">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Book your visit in 3 steps</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { n: "01", icon: Search, title: "Search", body: "Browse clinics and doctors by specialty, location, or availability." },
                { n: "02", icon: Clock, title: "Pick a slot", body: "See real-time availability and choose a time that works for you." },
                { n: "03", icon: Stethoscope, title: "Get care", body: "Receive instant confirmation and reminders before your visit." },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="relative"
                >
                  <div className="text-5xl font-bold text-primary/15">{s.n}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <s.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-hero relative overflow-hidden border-0 p-10 text-primary-foreground md:p-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Run a clinic? Grow with MediBook.</h2>
                <p className="mt-3 max-w-md text-primary-foreground/80">
                  Onboard your team, configure schedules, and start receiving bookings. We handle the patient side — you focus on care.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/for-clinics">List your clinic</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20" asChild>
                  <Link to="/contact">Talk to us</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Trust */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { k: "500+", v: "Verified clinics" },
              { k: "2,400+", v: "Trusted doctors" },
              { k: "98%", v: "On-time visits" },
              { k: "4.9", v: "Avg. patient rating", icon: Star },
            ].map((s) => (
              <Card key={s.v} className="p-6 text-center shadow-soft">
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary">
                  {s.k}
                  {s.icon && <s.icon className="h-5 w-5 fill-warning text-warning" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
