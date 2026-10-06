import type { OrderStatus } from "@/types/app";

// Small number helpers shared by the panel's Sales page and the admin dashboard.

export type StatusEventRow = { order_id: string; status: OrderStatus; at: string };

// Minutes between two status changes of each order, e.g. cooking -> on the way (prep time)
// or placed -> delivered (delivery time). Orders missing either step are skipped.
export function minutesBetween(events: StatusEventRow[], from: OrderStatus, to: OrderStatus): number[] {
  const starts = new Map<string, number>();
  const ends = new Map<string, number>();
  for (const event of events) {
    const at = new Date(event.at).getTime();
    if (event.status === from && !starts.has(event.order_id)) starts.set(event.order_id, at);
    if (event.status === to) ends.set(event.order_id, at);
  }
  const result: number[] = [];
  for (const [orderId, start] of starts) {
    const end = ends.get(orderId);
    if (end !== undefined && end >= start) result.push((end - start) / 60_000);
  }
  return result;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// "16 min", or "—" when there is nothing to measure yet.
export function formatMinutes(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)} min`;
}

// Short rupee amounts for big cards: ₹940, ₹14.2k, ₹1.02L.
export function compactRupees(amount: number): string {
  if (amount >= 100_000) return `₹${trim(amount / 100_000, 2)}L`;
  if (amount >= 1_000) return `₹${trim(amount / 1_000, 1)}k`;
  return `₹${Math.round(amount)}`;
}

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

// "₹1,240" (no paise) for tables.
export function wholeRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// "+12% vs last week" / "−3% vs last week" (empty when there is nothing to compare with)
export function percentChange(current: number, previous: number, suffix: string): string {
  if (previous === 0) return "";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}% ${suffix}`;
}

// "+38" / "−4"
export function signed(value: number, prefix = ""): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : "−"}${prefix}${Math.abs(rounded).toLocaleString("en-IN")}`;
}

export const sumTotals = (rows: { total: number | string }[]) =>
  Math.round(rows.reduce((sum, row) => sum + Number(row.total), 0) * 100) / 100;
