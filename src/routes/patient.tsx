import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { DashShell } from "@/components/DashShell";
import { LayoutDashboard, Calendar, Heart, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/patient")({ component: PatientLayout });

function PatientLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const nav = [
    { to: "/patient", label: "Overview", icon: LayoutDashboard },
    { to: "/patient/appointments", label: "Appointments", icon: Calendar },
    { to: "/patient/favorites", label: "Favorites", icon: Heart },
    { to: "/patient/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <DashShell title={user.email ?? "Patient"} subtitle="Your care, organized" nav={nav}>
      <Outlet />
    </DashShell>
  );
}
