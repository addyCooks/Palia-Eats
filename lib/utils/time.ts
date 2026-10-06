// Indian-time helpers (restaurants and customers are in India; servers run on UTC).
const OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Midnight at the start of today in Indian time, as an ISO timestamp.
export function startOfTodayIST(now: number = Date.now()): string {
  const istNow = new Date(now + OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - OFFSET_MS).toISOString();
}

// "2026-10-05": which Indian calendar day a moment falls on (used to group lists by day).
export function istDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

// "7:48 pm"
export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// "Sun, 5 Oct"
export function formatDayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

// Today's Indian calendar day, same format as istDateKey().
export function todayKeyIST(now: number = Date.now()): string {
  return new Date(now + OFFSET_MS).toISOString().slice(0, 10);
}
