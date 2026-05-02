import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Header, Footer } from "@/components/SiteChrome";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User as UserIcon, Heart, Bell } from "lucide-react";

export const Route = createFileRoute("/patient")({
  component: PatientHome,
});

function PatientHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your appointments and care, all in one place.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: Calendar, label: "My appointments", to: "/patient" as const },
            { icon: UserIcon, label: "Profile", to: "/patient/profile" as const },
            { icon: Heart, label: "Favorites", to: "/patient" as const },
            { icon: Bell, label: "Notifications", to: "/patient" as const },
          ].map((c) => (
            <Card key={c.label} className="bg-gradient-card p-5 shadow-soft">
              <c.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">{c.label}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-8 text-center shadow-soft">
          <h2 className="text-lg font-semibold">No upcoming appointments</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find a clinic and book your first visit.</p>
          <Button className="mt-4" asChild>
            <Link to="/search">Find care</Link>
          </Button>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
