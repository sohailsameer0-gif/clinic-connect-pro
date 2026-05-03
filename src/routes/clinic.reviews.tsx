import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinic, getReviewsForClinic } from "@/lib/data/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clinic/reviews")({ component: ClinicReviews });

function ClinicReviews() {
  const { data: clinic } = useQuery({ queryKey: ["my-clinic"], queryFn: getMyClinic });
  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["clinic-reviews-mgmt", clinic?.id], enabled: !!clinic,
    queryFn: () => getReviewsForClinic(clinic!.id),
  });
  const [replies, setReplies] = useState<Record<string, string>>({});

  const saveReply = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ reply: replies[id] || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reply saved"); refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
      <div className="mt-6 grid gap-3">
        {reviews.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</Card> : reviews.map(r => (
          <Card key={r.id} className="p-4 shadow-soft">
            <div className="flex items-center gap-1">{Array.from({length:5}).map((_,i)=> <Star key={i} className={`h-3 w-3 ${i<r.rating?"fill-yellow-400 text-yellow-400":"text-muted-foreground"}`} />)}</div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            <div className="mt-3">
              <Textarea rows={2} placeholder="Reply publicly…" defaultValue={r.reply ?? ""} onChange={(e)=>setReplies(p=>({...p,[r.id]:e.target.value}))} />
              <Button size="sm" className="mt-2" onClick={()=>saveReply(r.id)}>Save reply</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
