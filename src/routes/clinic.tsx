import { createFileRoute, Outlet, Navigate, Link } from "@tanstack/react-router";
import { useAuth, useIsAdmin, useIsClinicUser } from "@/lib/auth/AuthProvider";
import { DashShell } from "@/components/DashShell";
import { LayoutDashboard, Users2, Stethoscope, Calendar, Clock, Star, Settings, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyClinic } from "@/lib/data/queries";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/clinic")({ component: ClinicLayout });

function ClinicLayout() {
  const { user, loading } = useAuth();
  const isClinic = useIsClinicUser();
  const isAdmin = useIsAdmin();
  const { data: clinic, isLoading } = useQuery({
    queryKey: ["my-clinic"],
    queryFn: getMyClinic,
    enabled: !!user,
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  if (!isClinic && !isAdmin && !clinic) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-20">
          <Card className="max-w-md p-10 text-center shadow-elegant">
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
        </main>
        <Footer />
      </div>
    );
  }

  const nav = [
    { to: "/clinic", label: "Overview", icon: LayoutDashboard },
    { to: "/clinic/appointments", label: "Appointments", icon: Calendar },
    { to: "/clinic/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/clinic/services", label: "Services", icon: Users2 },
    { to: "/clinic/schedules", label: "Schedules", icon: Clock },
    { to: "/clinic/reviews", label: "Reviews", icon: Star },
    { to: "/clinic/staff", label: "Staff", icon: Mail },
    { to: "/clinic/settings", label: "Settings", icon: Settings },
  ];

  return (
    <DashShell title={clinic?.name ?? "Clinic"} subtitle={clinic?.status ? `Status: ${clinic.status}` : undefined} nav={nav}>
      <Outlet />
    </DashShell>
  );
}
