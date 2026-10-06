import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfTodayIST } from "@/lib/utils/time";
import type { MenuCategory, MenuItem, OrderItem, Order } from "@/types/app";

// Reads for the restaurant panel. Service-role client, so every query is limited to
// the restaurant id that came from the verified panel link.

export type PanelOrder = Order & { order_items: OrderItem[] };

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "out_for_delivery"];

export async function getPanelOrders(restaurantId: string) {
  const admin = createAdminClient();

  const [active, recent] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .in("status", ACTIVE_STATUSES)
      .order("placed_at", { ascending: true }),
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .not("status", "in", `(${ACTIVE_STATUSES.join(",")})`)
      .order("status_updated_at", { ascending: false })
      .limit(20),
  ]);

  if (active.error) throw new Error(`Could not load orders: ${active.error.message}`);
  if (recent.error) throw new Error(`Could not load orders: ${recent.error.message}`);

  return {
    active: (active.data ?? []) as PanelOrder[],
    recent: (recent.data ?? []) as PanelOrder[],
  };
}

export async function getPanelMenu(restaurantId: string) {
  const admin = createAdminClient();

  const [categories, items] = await Promise.all([
    admin
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
    admin
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
  ]);

  if (categories.error) throw new Error(`Could not load menu: ${categories.error.message}`);
  if (items.error) throw new Error(`Could not load menu: ${items.error.message}`);

  return {
    categories: (categories.data ?? []) as MenuCategory[],
    items: (items.data ?? []) as MenuItem[],
  };
}

export type PanelHistoryStats = { orders: number; collected: number; cancelled: number };

// Everything the History tab shows: today's numbers and a searchable list of past orders.
// Search by order number, customer name or phone.
export async function getPanelHistory(restaurantId: string, search: string) {
  const admin = createAdminClient();
  const todayStart = startOfTodayIST();

  // Keep only characters that can't break the filter syntax.
  const q = search.replace(/[^\p{L}\p{N} .'+-]/gu, "").trim().slice(0, 40);

  let list = admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurantId)
    .order("placed_at", { ascending: false })
    .limit(80);
  if (q) {
    list = /^\d{1,9}$/.test(q)
      ? list.or(`order_number.eq.${q},customer_phone.ilike.*${q}*`)
      : list.or(`customer_name.ilike.*${q}*,customer_phone.ilike.*${q}*`);
  }

  const [orders, today] = await Promise.all([
    list,
    admin.from("orders").select("status, total").eq("restaurant_id", restaurantId).gte("placed_at", todayStart),
  ]);
  if (orders.error) throw new Error(`Could not load order history: ${orders.error.message}`);
  if (today.error) throw new Error(`Could not load today's numbers: ${today.error.message}`);

  const stats: PanelHistoryStats = { orders: 0, collected: 0, cancelled: 0 };
  for (const order of today.data ?? []) {
    stats.orders++;
    if (order.status === "delivered") stats.collected += Number(order.total);
    if (order.status === "cancelled" || order.status === "rejected") stats.cancelled++;
  }
  stats.collected = Math.round(stats.collected * 100) / 100;

  return { stats, orders: (orders.data ?? []) as PanelOrder[], searching: q.length > 0 };
}
