import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header, Footer } from "@/components/SiteChrome";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface DashNav {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function DashShell({ title, subtitle, nav, children }: { title: string; subtitle?: string; nav: DashNav[]; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto flex flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-60">
          <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft md:sticky md:top-24">
            <div className="px-2 py-2">
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <nav className="mt-1 grid gap-0.5">
              {nav.map((n) => {
                const active = path === n.to || (n.to !== "/clinic" && n.to !== "/admin" && n.to !== "/patient" && path.startsWith(n.to));
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
