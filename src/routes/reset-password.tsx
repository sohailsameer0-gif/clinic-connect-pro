import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { resetSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — MediBook" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = async ({ password }: { password: string; confirm: string }) => {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground"><Stethoscope className="h-5 w-5" /></span>
            <span className="text-lg">MediBook</span>
          </Link>
          <Card className="p-8 shadow-elegant">
            <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password && <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" {...form.register("confirm")} />
                {form.formState.errors.confirm && <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirm.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
