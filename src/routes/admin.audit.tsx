import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({ component: AdminAudit });

function AdminAudit() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-audit-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [refetch]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Recent system and admin actions.</p>

      <Card className="mt-6 divide-y divide-border/60 p-0 shadow-soft">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No audit entries yet.</div>
        )}
        {(data ?? []).map((row) => (
          <div key={row.id} className="flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{row.action}</span>
                {row.target && <span className="text-xs text-muted-foreground">→ {row.target}</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
              {row.meta && Object.keys(row.meta as object).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  {JSON.stringify(row.meta, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
