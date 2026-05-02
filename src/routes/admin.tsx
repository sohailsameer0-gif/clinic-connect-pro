import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Header, Footer } from "@/components/SiteChrome";
import { useAuth, useIsAdmin } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminHome });

function AdminHome() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-20">
          <Card className="max-w-md p-10 text-center shadow-elegant">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have super admin permissions. Ask an existing admin to grant you access.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide management — clinics, users, content, and settings.</p>
      </main>
      <Footer />
    </div>
  );
}
