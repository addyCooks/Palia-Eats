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

function keyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// "2026-10-05" + 3 days = "2026-10-08"
export function addDaysToKey(dateKey: string, days: number): string {
  return new Date(keyToUtcMs(dateKey) + days * 86_400_000).toISOString().slice(0, 10);
}

// Midnight (Indian time) at the start of that calendar day, as an ISO timestamp.
export function istDayStart(dateKey: string): string {
  return new Date(keyToUtcMs(dateKey) - OFFSET_MS).toISOString();
}

// 0 = Sunday ... 6 = Saturday, for an Indian calendar day.
export function weekdayOfKey(dateKey: string): number {
  return new Date(keyToUtcMs(dateKey)).getUTCDay();
}

// The Monday that starts the (Monday–Sunday) week containing this day.
export function mondayOfKey(dateKey: string): string {
  return addDaysToKey(dateKey, -((weekdayOfKey(dateKey) + 6) % 7));
}

// "Wed"
export function weekdayShortOfKey(dateKey: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekdayOfKey(dateKey)];
}

// "30 Sep" (or "30 Sep 2025" when asked)
export function formatKeyShort(dateKey: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(new Date(keyToUtcMs(dateKey)));
}

// "30 Sep – 6 Oct", or "23 – 29 Sep" inside one month.
export function formatKeyRange(fromKey: string, toKey: string): string {
  if (fromKey.slice(0, 7) === toKey.slice(0, 7)) {
    return `${Number(fromKey.slice(8))} – ${formatKeyShort(toKey)}`;
  }
  return `${formatKeyShort(fromKey)} – ${formatKeyShort(toKey)}`;
}

// "Tuesday, 6 Oct"
export function formatLongToday(now: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(now));
}

// "3 min ago", "1 h 5 min ago"; whole minutes only.
export function minutesAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

// The hour of the day (0-23) in Indian time.
export function istHour(iso: string): number {
  return new Date(new Date(iso).getTime() + OFFSET_MS).getUTCHours();
}
