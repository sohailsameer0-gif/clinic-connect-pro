import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth, useIsAdmin } from "@/lib/auth/AuthProvider";
import { DashShell } from "@/components/DashShell";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, Building2, Users2, ShieldAlert, Star, FileText } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
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

  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/clinics", label: "Clinics", icon: Building2 },
    { to: "/admin/users", label: "Users", icon: Users2 },
    { to: "/admin/reviews", label: "Reviews", icon: Star },
    { to: "/admin/audit", label: "Audit log", icon: FileText },
  ];

  return (
    <DashShell title="Admin" subtitle="Platform management" nav={nav}>
      <Outlet />
    </DashShell>
  );
}
