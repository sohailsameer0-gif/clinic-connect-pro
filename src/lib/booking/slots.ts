/**
 * Booking engine helpers. Pure functions — no Supabase imports.
 * Generates slot grids from a doctor's weekly schedule and excludes booked / past / blocked slots.
 */

export interface Schedule {
  weekday: number; // 0-6 (Sun-Sat)
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  slot_minutes: number;
  max_per_slot: number;
  buffer_min: number;
  active: boolean;
}

export interface BookedRange {
  starts_at: string; // ISO
  ends_at: string;
}

export interface SlotInfo {
  start: Date;
  end: Date;
  available: boolean;
  reason?: "booked" | "past" | "cutoff";
}

const parseTimeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function generateSlotsForDate(
  date: Date,
  schedules: Schedule[],
  booked: BookedRange[],
  options: { cutoffMinutes?: number; holiday?: boolean } = {},
): SlotInfo[] {
  if (options.holiday) return [];

  const weekday = date.getDay();
  const daySchedules = schedules.filter((s) => s.active && s.weekday === weekday);
  if (daySchedules.length === 0) return [];

  const cutoff = options.cutoffMinutes ?? 60;
  const cutoffTime = new Date(Date.now() + cutoff * 60_000);

  const slots: SlotInfo[] = [];
  for (const sch of daySchedules) {
    const startMin = parseTimeToMinutes(sch.start_time);
    const endMin = parseTimeToMinutes(sch.end_time);
    const step = sch.slot_minutes + (sch.buffer_min ?? 0);
    for (let m = startMin; m + sch.slot_minutes <= endMin; m += step) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(m);
      const end = new Date(start.getTime() + sch.slot_minutes * 60_000);

      let available = true;
      let reason: SlotInfo["reason"];

      if (start < cutoffTime) {
        available = false;
        reason = start.getTime() < Date.now() ? "past" : "cutoff";
      } else {
        // count overlaps
        const overlaps = booked.filter((b) => {
          const bs = new Date(b.starts_at).getTime();
          const be = new Date(b.ends_at).getTime();
          return bs < end.getTime() && be > start.getTime();
        }).length;
        if (overlaps >= sch.max_per_slot) {
          available = false;
          reason = "booked";
        }
      }

      slots.push({ start, end, available, reason });
    }
  }
  // sort by start time
  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}

export function formatSlot(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  rescheduled: "Rescheduled",
  no_show: "No Show",
};
