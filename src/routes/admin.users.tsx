import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Shield, ShieldOff, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
      const { data: profs, error } = await query.limit(200);
      if (error) throw error;
      const ids = (profs ?? []).map((p) => p.id);
      if (ids.length === 0) return [];
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const map = new Map<string, Role[]>();
      (roles ?? []).forEach((r) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role as Role);
        map.set(r.user_id, arr);
      });
      return (profs ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  const toggleBlocked = async (id: string, blocked: boolean) => {
    if (id === me?.id) return toast.error("You can't block yourself");
    const { error } = await supabase.from("profiles").update({ blocked: !blocked }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(blocked ? "User unblocked" : "User blocked");
    refetch();
  };

  const toggleRole = async (userId: string, role: Role, has: boolean) => {
    if (userId === me?.id && role === "super_admin" && has) return toast.error("You can't remove your own admin role");
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles updated");
    refetch();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage platform users, roles, and access.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-9 w-64" />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-soft">No users found.</Card>
        )}
        {(data ?? []).map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 shadow-soft">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <h3 className="truncate font-semibold">{u.full_name ?? "Unnamed"}</h3>
                {u.blocked && <Badge variant="destructive">Blocked</Badge>}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {u.phone ?? "no phone"} · {u.city ?? "—"} · joined {new Date(u.created_at).toLocaleDateString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {u.roles.length === 0 && <span className="text-xs text-muted-foreground">no roles</span>}
                {u.roles.map((r) => (
                  <Badge key={r} variant="secondary">{r}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["super_admin", "clinic_owner", "patient", "doctor"] as Role[]).map((role) => {
                const has = u.roles.includes(role);
                return (
                  <Button key={role} size="sm" variant={has ? "default" : "outline"} onClick={() => toggleRole(u.id, role, has)}>
                    {has ? "−" : "+"} {role.replace("_", " ")}
                  </Button>
                );
              })}
              <Button size="sm" variant={u.blocked ? "outline" : "ghost"} className={u.blocked ? "" : "text-destructive hover:text-destructive"} onClick={() => toggleBlocked(u.id, u.blocked)}>
                {u.blocked ? <Shield className="mr-1 h-4 w-4" /> : <ShieldOff className="mr-1 h-4 w-4" />}
                {u.blocked ? "Unblock" : "Block"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
