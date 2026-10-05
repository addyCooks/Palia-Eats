// An order still sitting at "Order placed" after this long is probably being missed.
export const OVERDUE_AFTER_MINUTES = 10;

export function isOrderOverdue(status: string, placedAt: string, now: number = Date.now()): boolean {
  if (status !== "pending" && status !== "accepted") return false;
  return now - new Date(placedAt).getTime() > OVERDUE_AFTER_MINUTES * 60_000;
}
