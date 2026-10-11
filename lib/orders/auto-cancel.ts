// What to do with an order that is still sitting at "Order placed" (status pending).
// Pure (no imports) so the rules can be tested on their own. Used by the timer route
// app/api/cron/pending-orders.

export const REMIND_AFTER_MINUTES = 5; // nudge the restaurant by email
export const AUTO_CANCEL_AFTER_MINUTES = 15; // nobody answered: cancel and tell the customer
export const STALE_AFTER_HOURS = 24; // far older than that: tidy away quietly, don't email anyone
export const AUTO_CANCEL_REASON = "The restaurant didn't answer in time";

export type PendingAction = "none" | "remind" | "cancel" | "cancel_quietly";

export function pendingAction(placedAtMs: number, nowMs: number): PendingAction {
  const minutes = (nowMs - placedAtMs) / 60_000;
  if (minutes >= STALE_AFTER_HOURS * 60) return "cancel_quietly";
  if (minutes >= AUTO_CANCEL_AFTER_MINUTES) return "cancel";
  if (minutes >= REMIND_AFTER_MINUTES) return "remind";
  return "none";
}
