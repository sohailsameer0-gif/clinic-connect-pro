import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Loader2, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { signupSchema, type SignupInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — MediBook" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", role: "patient" },
  });
  const role = form.watch("role");

  const onSubmit = async (values: SignupInput) => {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.fullName, intended_role: values.role },
      },
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSubmitting(false);
      toast.success("Check your email to verify your account, then sign in.");
      navigate({ to: "/login" });
      return;
    }
    // If the new user signed up as a clinic, grant clinic_owner role immediately (ignore duplicate)
    if (values.role === "clinic" && data.user) {
      await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "clinic_owner" }, { onConflict: "user_id,role" });
    }
    setSubmitting(false);
    toast.success("Account created!");
    navigate({ to: values.role === "clinic" ? "/clinic/onboarding" : "/patient" });
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setGoogleLoading(false); toast.error("Google sign-in failed"); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-lg">MediBook</span>
          </Link>
          <Card className="p-8 shadow-elegant">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join thousands managing care effortlessly.</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { v: "patient", icon: User, label: "I'm a patient", sub: "Book appointments" },
                { v: "clinic", icon: Building2, label: "I run a clinic", sub: "List my practice" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => form.setValue("role", opt.v as "patient" | "clinic")}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === opt.v ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"
                  }`}
                >
                  <opt.icon className={`h-5 w-5 ${role === opt.v ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mt-2 text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </button>
              ))}
            </div>

            <Button type="button" variant="outline" className="mt-6 w-full" onClick={onGoogle} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.5 12 2.5 6.8 2.5 2.7 6.6 2.7 12s4.1 9.5 9.3 9.5c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.5z"/></svg>
              )}
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...form.register("fullName")} />
                {form.formState.errors.fullName && <p className="mt-1 text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                  {form.formState.errors.password && <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
                  {form.formState.errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
