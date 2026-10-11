import "server-only";

// Two cheap traps that real people never trigger (see components/forms/BotTraps.tsx):
//  1. a hidden "website" box that only a robot fills in,
//  2. a form sent faster than a person could type it (fillMs = milliseconds since the form
//     appeared, measured in the visitor's browser).
// Forms posted without JavaScript carry no timing, so only the first trap applies to them.
const MIN_FILL_MS = 1200;

export function looksLikeBot(formData: FormData): boolean {
  if (String(formData.get("website") ?? "").trim()) return true;

  const raw = String(formData.get("fillMs") ?? "").trim();
  if (raw) {
    const ms = Number(raw);
    if (Number.isFinite(ms) && ms >= 0 && ms < MIN_FILL_MS) return true;
  }
  return false;
}
