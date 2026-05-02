import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header, Footer } from "@/components/SiteChrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validation/schemas";

export const Route = createFileRoute("/patient/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", city: "", bio: "" },
  });

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) form.reset({
        fullName: data.full_name ?? "",
        phone: data.phone ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
      });
    });
  }, [user, form]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const onSubmit = async (v: ProfileInput) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: v.fullName,
      phone: v.phone || null,
      city: v.city || null,
      bio: v.bio || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <Card className="mt-6 max-w-2xl p-6 shadow-soft">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...form.register("fullName")} />
              {form.formState.errors.fullName && <p className="mt-1 text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} {...form.register("bio")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
