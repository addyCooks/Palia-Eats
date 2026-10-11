import { createClient } from "@/lib/supabase/server";
import { addDaysToKey, istDayStart, todayKeyIST } from "@/lib/utils/time";

export type FunnelStep = { key: string; label: string; count: number };

// Visits that reached each step over the last `days` days, ending with orders placed on the website.
// The first four steps are anonymous visit counts; orders come from the orders table.
export async function getFunnel(days: number): Promise<FunnelStep[]> {
  const supabase = await createClient();
  const today = todayKeyIST();
  const from = addDaysToKey(today, -(days - 1));

  const [counts, orders] = await Promise.all([
    supabase.from("funnel_counts").select("event, hits").gte("day", from).lte("day", today),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("channel", "web")
      .neq("status", "cancelled")
      .gte("placed_at", istDayStart(from)),
  ]);

  const totals = new Map<string, number>();
  for (const row of counts.data ?? []) totals.set(row.event, (totals.get(row.event) ?? 0) + Number(row.hits));

  return [
    { key: "visit", label: "Visited PaliaEats", count: totals.get("visit") ?? 0 },
    { key: "restaurant_view", label: "Opened a restaurant", count: totals.get("restaurant_view") ?? 0 },
    { key: "add_to_cart", label: "Added a dish to the cart", count: totals.get("add_to_cart") ?? 0 },
    { key: "checkout_start", label: "Reached checkout", count: totals.get("checkout_start") ?? 0 },
    { key: "order", label: "Placed an order", count: orders.count ?? 0 },
  ];
}
