import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Header, Footer } from "@/components/SiteChrome";
import { useAuth, useIsClinicUser } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/clinic")({ component: ClinicHome });

function ClinicHome() {
  const { user, loading } = useAuth();
  const isClinic = useIsClinicUser();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Clinic dashboard</h1>
        {!isClinic ? (
          <Card className="mt-6 p-10 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">List your clinic on MediBook</h2>
            <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
              Create your clinic profile to start receiving bookings. Our team reviews each listing before it goes live.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/clinic/onboarding">Get started</Link>
            </Button>
          </Card>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Your clinic management area — doctors, services, schedules, and bookings will appear here.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
