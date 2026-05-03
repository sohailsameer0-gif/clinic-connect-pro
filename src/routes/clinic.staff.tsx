import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/clinic/staff")({ component: ClinicStaff });

function ClinicStaff() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: invites = [], refetch } = useQuery({
    queryKey: ["staff-invites", clinic?.id], enabled: !!clinic,
    queryFn: async () => {
      const { data } = await supabase.from("staff_invites").select("*").eq("clinic_id", clinic!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const [email, setEmail] = useState("");

  const invite = async () => {
    if (!clinic || !email) return;
    const { error } = await supabase.from("staff_invites").insert({ clinic_id: clinic.id, email, role: "staff" });
    if (error) return toast.error(error.message);
    toast.success("Invite created"); setEmail(""); refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
      <Card className="mt-6 p-4 shadow-soft">
        <Label>Invite by email</Label>
        <div className="mt-2 flex gap-2">
          <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@example.com" />
          <Button onClick={invite}>Invite</Button>
        </div>
      </Card>
      <div className="mt-4 grid gap-2">
        {invites.map(i => (
          <Card key={i.id} className="flex items-center justify-between p-3 shadow-soft">
            <div><p className="text-sm font-medium">{i.email}</p><p className="text-xs text-muted-foreground">{i.role} · {i.status}</p></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
