import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: () => <ComingSoon title="Search clinics & doctors" />,
});

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-20">
        <Card className="max-w-md p-10 text-center shadow-elegant">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is part of the next build pass. Core auth, database, and the patient/clinic/admin foundations are wired up — UI pages will land in the next iteration.
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
