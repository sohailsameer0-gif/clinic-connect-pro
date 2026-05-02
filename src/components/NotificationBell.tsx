import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

type Notif = Database["public"]["Tables"]["notifications"]["Row"];

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => active && setItems(data ?? []));

    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [payload.new as Notif, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) => prev.map((n) => (n.id === (payload.new as Notif).id ? (payload.new as Notif) : n)));
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((n) => n.id !== (payload.old as Notif).id));
          }
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(ch);
    };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };
  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[360px]">
          {items.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-2 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">Notifications will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`group flex gap-3 px-4 py-3 transition hover:bg-accent/40 ${!n.read ? "bg-accent/20" : ""}`}
                >
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {!n.read && (
                        <button
                          onClick={() => markOne(n.id)}
                          className="opacity-0 transition group-hover:opacity-100"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
