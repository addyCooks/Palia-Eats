import type { Restaurant } from "@/types/app";

// Restaurants run on local (Indian) time. Servers (Vercel) run on UTC, so we
// always work out "now" in this time zone.
const TIME_ZONE = "Asia/Kolkata";

function currentMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
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

function isWithinHours(opening: string | null, closing: string | null, now: Date): boolean {
  if (!opening || !closing) return true; // no hours set = always open
  const start = toMinutes(opening);
  const end = toMinutes(closing);
  const current = currentMinutes(now);
  if (start === end) return true;
  // Normal day (10:00-22:00) or crossing midnight (18:00-02:00)
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export type RestaurantStatus = {
  state: "open" | "closed" | "paused";
  label: string;
  canOrder: boolean;
};

export function getRestaurantStatus(
  restaurant: Pick<Restaurant, "opening_time" | "closing_time" | "is_accepting_orders">,
  now: Date = new Date(),
): RestaurantStatus {
  if (!restaurant.is_accepting_orders) {
    return { state: "paused", label: "Not taking orders right now", canOrder: false };
  }
  if (!isWithinHours(restaurant.opening_time, restaurant.closing_time, now)) {
    const opens = restaurant.opening_time ? ` · Opens ${formatTime(restaurant.opening_time)}` : "";
    return { state: "closed", label: `Closed${opens}`, canOrder: false };
  }
  return { state: "open", label: "Open now", canOrder: true };
}
