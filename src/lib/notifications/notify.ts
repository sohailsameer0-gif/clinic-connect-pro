/**
 * Notification helpers. Best-effort inserts via the public client (RLS allows
 * users to insert their own and admins to insert any). For cross-user
 * notifications (e.g. clinic notifying patient), we rely on triggers in future
 * iterations or surface them inline. For v1 we always notify the actor.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export async function notifySelf(type: NotificationType, title: string, body?: string, data?: Record<string, unknown>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("notifications").insert({
    user_id: u.user.id,
    type,
    title,
    body: body ?? null,
    data: (data ?? {}) as never,
  });
}
