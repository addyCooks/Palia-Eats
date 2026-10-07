import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addDaysToKey,
  istDateKey,
  istDayStart,
  startOfTodayIST,
  todayKeyIST,
  weekdayShortOfKey,
} from "@/lib/utils/time";
import { ACTIVE_STATUSES, CANCELLED_STATUSES } from "@/lib/orders/status";
import { average, minutesBetween, type StatusEventRow } from "@/lib/orders/stats";
import { getWeeklyDishCounts } from "@/lib/queries/menu-stats";
import type { MenuCategory, MenuItem, OrderItem, Order, OrderStatus } from "@/types/app";

// Reads for the restaurant panel. Service-role client, so every query is limited to
// the restaurant id that came from the verified panel link.

export type PanelOrder = Order & { order_items: OrderItem[] };

export async function countNewPanelOrders(restaurantId: string): Promise<number> {
  const { count } = await createAdminClient()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "accepted"]);
  return count ?? 0;
}

// Status changes of these orders (for prep and delivery times).
async function statusEvents(orderIds: string[]): Promise<StatusEventRow[]> {
  if (orderIds.length === 0) return [];
  const rows: StatusEventRow[] = [];
  // Keep each request's URL short.
  for (let i = 0; i < orderIds.length; i += 150) {
    const { data, error } = await createAdminClient()
      .from("order_status_events")
      .select("order_id, status, at")
      .in("order_id", orderIds.slice(i, i + 150));
    if (error) throw new Error(`Could not load order times: ${error.message}`);
    rows.push(...((data ?? []) as StatusEventRow[]));
  }
  return rows;
}

// The live board: every open order, plus today's numbers for the header.
export async function getPanelOrders(restaurantId: string) {
  const admin = createAdminClient();
  const [active, today, delivered] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .in("status", ACTIVE_STATUSES)
      .order("placed_at", { ascending: true }),
    admin
      .from("orders")
      .select("id, status, total")
      .eq("restaurant_id", restaurantId)
      .gte("placed_at", startOfTodayIST()),
    // Delivered today (newest first), so a mistaken "Mark delivered" can be undone.
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .eq("status", "delivered")
      .gte("status_updated_at", startOfTodayIST())
      .order("status_updated_at", { ascending: false })
      .limit(12),
  ]);
  if (active.error) throw new Error(`Could not load orders: ${active.error.message}`);
  if (today.error) throw new Error(`Could not load today's numbers: ${today.error.message}`);

  const todayRows = today.data ?? [];
  const counted = todayRows.filter((row) => !CANCELLED_STATUSES.includes(row.status as OrderStatus));
  const events = await statusEvents(todayRows.map((row) => row.id));

  return {
    active: (active.data ?? []) as PanelOrder[],
    delivered: (delivered.data ?? []) as PanelOrder[],
    stats: {
      orders: counted.length,
      sales: counted.reduce((sum, row) => sum + Number(row.total), 0),
      avgPrep: average(minutesBetween(events, "preparing", "out_for_delivery")),
    },
  };
}

export async function getPanelMenu(restaurantId: string) {
  const admin = createAdminClient();

  const [categories, items, weekly] = await Promise.all([
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
    getWeeklyDishCounts(admin, restaurantId),
  ]);

  if (categories.error) throw new Error(`Could not load menu: ${categories.error.message}`);
  if (items.error) throw new Error(`Could not load menu: ${items.error.message}`);

  return {
    categories: (categories.data ?? []) as MenuCategory[],
    items: (items.data ?? []) as MenuItem[],
    weekly,
  };
}

export type HistoryFilter = "all" | "delivered" | "cancelled" | "week";
export const HISTORY_PAGE_SIZE = 20;

// Order history: search by order number, customer name or phone; filter; page.
export async function getPanelHistory(
  restaurantId: string,
  { search, filter, page }: { search: string; filter: HistoryFilter; page: number },
) {
  const admin = createAdminClient();

  // Keep only characters that can't break the filter syntax.
  const q = search.replace(/[^\p{L}\p{N} .'+-]/gu, "").trim().slice(0, 40);

  let list = admin
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .eq("restaurant_id", restaurantId)
    .order("placed_at", { ascending: false })
    .range((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE - 1);
  if (filter === "delivered") list = list.eq("status", "delivered");
  if (filter === "cancelled") list = list.in("status", CANCELLED_STATUSES);
  if (filter === "week") list = list.gte("placed_at", istDayStart(addDaysToKey(todayKeyIST(), -6)));
  if (q) {
    list = /^\d{1,9}$/.test(q)
      ? list.or(`order_number.eq.${q},customer_phone.ilike.*${q}*`)
      : list.or(`customer_name.ilike.*${q}*,customer_phone.ilike.*${q}*`);
  }

  const [orders, first] = await Promise.all([
    list,
    admin
      .from("orders")
      .select("placed_at", { count: "exact" })
      .eq("restaurant_id", restaurantId)
      .order("placed_at", { ascending: true })
      .limit(1),
  ]);
  if (orders.error) throw new Error(`Could not load order history: ${orders.error.message}`);

  return {
    orders: (orders.data ?? []) as PanelOrder[],
    total: orders.count ?? 0,
    allTime: first.count ?? 0,
    firstOrderAt: first.data?.[0]?.placed_at ?? null,
    searching: q.length > 0,
  };
}

// The Sales page: the last 7 days (today included) compared with the 7 days before.
export async function getPanelSales(restaurantId: string) {
  const admin = createAdminClient();
  const todayKey = todayKeyIST();
  const weekStartKey = addDaysToKey(todayKey, -6);
  const prevStartKey = addDaysToKey(todayKey, -13);

  const { data, error } = await admin
    .from("orders")
    .select("id, order_number, status, total, placed_at, customer_name, order_items(menu_item_id, item_name, quantity, variant)")
    .eq("restaurant_id", restaurantId)
    .gte("placed_at", istDayStart(prevStartKey))
    .order("placed_at", { ascending: true })
    .limit(10000);
  if (error) throw new Error(`Could not load sales: ${error.message}`);

  type Row = {
    id: string;
    order_number: number;
    status: OrderStatus;
    total: number;
    placed_at: string;
    customer_name: string;
    order_items: { menu_item_id: string | null; item_name: string; quantity: number; variant: string }[];
  };
  const rows = (data ?? []) as Row[];
  const thisWeek = rows.filter((row) => istDateKey(row.placed_at) >= weekStartKey);
  const lastWeek = rows.filter((row) => istDateKey(row.placed_at) < weekStartKey);

  const summarize = (list: Row[]) => {
    const delivered = list.filter((row) => row.status === "delivered");
    const cancelled = list.filter((row) => CANCELLED_STATUSES.includes(row.status));
    const revenue = delivered.reduce((sum, row) => sum + Number(row.total), 0);
    return {
      revenue,
      orders: list.length - cancelled.length,
      delivered: delivered.length,
      avgOrder: delivered.length ? revenue / delivered.length : 0,
      cancelled: cancelled.length,
      all: list.length,
    };
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysToKey(weekStartKey, i);
    const revenue = thisWeek
      .filter((row) => row.status === "delivered" && istDateKey(row.placed_at) === key)
      .reduce((sum, row) => sum + Number(row.total), 0);
    return { key, label: weekdayShortOfKey(key), revenue };
  });

  // Best sellers by plates sold (half plates count as plates of the same dish).
  const dishes = new Map<string, { name: string; sold: number }>();
  for (const row of thisWeek) {
    if (CANCELLED_STATUSES.includes(row.status)) continue;
    for (const item of row.order_items) {
      const name = item.item_name.replace(/ \(Half\)$/, "");
      const key = item.menu_item_id ?? name;
      const entry = dishes.get(key) ?? { name, sold: 0 };
      entry.sold += item.quantity;
      dishes.set(key, entry);
    }
  }

  return {
    from: weekStartKey,
    to: todayKey,
    current: summarize(thisWeek),
    previous: summarize(lastWeek),
    days,
    topDishes: [...dishes.values()].sort((a, b) => b.sold - a.sold).slice(0, 5),
    orders: thisWeek,
  };
}
