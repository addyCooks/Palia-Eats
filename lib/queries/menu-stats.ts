import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysToKey, istDayStart, todayKeyIST } from "@/lib/utils/time";
import { CANCELLED_STATUSES } from "@/lib/orders/status";

// Plates of each dish sold in the last 7 days (cancelled orders don't count).
// The caller passes a client that is allowed to read this restaurant's orders.
export async function getWeeklyDishCounts(client: SupabaseClient, restaurantId: string): Promise<Map<string, number>> {
  const since = istDayStart(addDaysToKey(todayKeyIST(), -6));
  const { data } = await client
    .from("order_items")
    .select("menu_item_id, quantity, orders!inner(restaurant_id, placed_at, status)")
    .eq("orders.restaurant_id", restaurantId)
    .gte("orders.placed_at", since)
    .not("orders.status", "in", `(${CANCELLED_STATUSES.join(",")})`)
    .limit(5000);

  const weekly = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.menu_item_id) continue;
    weekly.set(row.menu_item_id, (weekly.get(row.menu_item_id) ?? 0) + row.quantity);
  }
  return weekly;
}
