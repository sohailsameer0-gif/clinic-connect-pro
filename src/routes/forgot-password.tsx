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
import { forgotSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — MediBook" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = async ({ email }: { email: string }) => {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email for the reset link.");
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
            <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you a reset link.</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
