import type { Restaurant } from "@/types/app";

// Restaurants run on local (Indian) time. Servers (Vercel) run on UTC, so we
// always work out "now" in this time zone.
const TIME_ZONE = "Asia/Kolkata";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Current clock time (minutes since midnight) and weekday (0 = Sunday) in India.
function localNow(now: Date): { minutes: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return { minutes: hour * 60 + minute, day: WEEKDAY_INDEX[weekday] ?? 0 };
}

// "10:30:00" -> 630
function toMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

// "22:00:00" -> "10:00 PM"
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

type HoursFields = Pick<Restaurant, "opening_time" | "closing_time"> & {
  closed_days?: number[] | null;
};

// Same rule as the database function is_within_hours() (which place_order uses).
function isWithinHours(restaurant: HoursFields, now: Date): boolean {
  const { opening_time: opening, closing_time: closing } = restaurant;
  const { minutes, day } = localNow(now);
  const start = opening ? toMinutes(opening) : null;
  const end = closing ? toMinutes(closing) : null;
  const hasWindow = start !== null && end !== null && start !== end;

  // A window that crosses midnight belongs to the day it started on.
  const crossesMidnight = hasWindow && start > end;
  const effectiveDay = crossesMidnight && minutes < end ? (day + 6) % 7 : day;
  if ((restaurant.closed_days ?? []).includes(effectiveDay)) return false;

  if (!hasWindow) return true; // no hours set = open all day
  return crossesMidnight ? minutes >= start || minutes < end : minutes >= start && minutes < end;
}

export type RestaurantStatus = {
  state: "open" | "closed" | "paused";
  label: string;
  canOrder: boolean;
};

export function getRestaurantStatus(
  restaurant: HoursFields & Pick<Restaurant, "is_accepting_orders">,
  now: Date = new Date(),
): RestaurantStatus {
  if (!restaurant.is_accepting_orders) {
    return { state: "paused", label: "Not taking orders right now", canOrder: false };
  }
  if (!isWithinHours(restaurant, now)) {
    const closedToday = (restaurant.closed_days ?? []).includes(localNow(now).day);
    if (closedToday) return { state: "closed", label: "Closed today", canOrder: false };
    const opens = restaurant.opening_time ? ` · Opens ${formatTime(restaurant.opening_time)}` : "";
    return { state: "closed", label: `Closed${opens}`, canOrder: false };
  }
  return { state: "open", label: "Open now", canOrder: true };
}

// When a closed restaurant opens next: "today at 6:00 PM", "tomorrow at 11:00 AM",
// "on Monday at 11:00 AM" (or "tomorrow" when it has no set hours). Null when it never
// opens (closed every day). Only looks at hours and days off, not the pause switch.
export function nextOpening(restaurant: HoursFields, now: Date = new Date()): string | null {
  const { minutes, day } = localNow(now);
  const closedDays = restaurant.closed_days ?? [];
  const start = restaurant.opening_time ? toMinutes(restaurant.opening_time) : null;
  const end = restaurant.closing_time ? toMinutes(restaurant.closing_time) : null;
  const hasWindow = start !== null && end !== null && start !== end;
  const at = hasWindow && restaurant.opening_time ? ` at ${formatTime(restaurant.opening_time)}` : "";

  for (let ahead = 0; ahead <= 7; ahead++) {
    const weekday = (day + ahead) % 7;
    if (closedDays.includes(weekday)) continue;
    if (ahead === 0 && (!hasWindow || minutes >= start)) continue; // already past today's opening
    if (ahead === 0) return `today${at}`;
    if (ahead === 1) return `tomorrow${at}`;
    return `on ${DAY_NAMES[weekday]}${at}`;
  }
  return null;
}

// "Closed on Monday, Tuesday" (or null when open every day)
export function describeClosedDays(closedDays: number[] | null | undefined): string | null {
  if (!closedDays?.length) return null;
  return `Closed on ${closedDays.map((day) => DAY_NAMES[day]).join(", ")}`;
}
