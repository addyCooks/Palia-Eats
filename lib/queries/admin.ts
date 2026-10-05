import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/app";

// Admin-only reads. They use the logged-in admin's session, so database rules
// (RLS) decide what is visible; no special key is needed.

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "out_for_delivery"];

// Midnight at the start of today in Indian time, as an ISO timestamp.
function startOfTodayIST(): string {
  const offset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + offset);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - offset).toISOString();
}

export async function getAdminOverview() {
  const supabase = await createClient();
  const todayStart = startOfTodayIST();

  const [restaurants, customers, totalOrders, todayOrders, activeOrders] = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total, status").gte("placed_at", todayStart),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ACTIVE_STATUSES),
  ]);

  const failed = [restaurants, customers, totalOrders, todayOrders, activeOrders].find((r) => r.error);
  if (failed?.error) throw new Error(`Could not load the overview: ${failed.error.message}`);

  const today = todayOrders.data ?? [];
  const sales = today
    .filter((order) => order.status !== "cancelled" && order.status !== "rejected")
    .reduce((sum, order) => sum + Number(order.total), 0);

  return {
    restaurants: restaurants.count ?? 0,
    customers: customers.count ?? 0,
    totalOrders: totalOrders.count ?? 0,
    ordersToday: today.length,
    activeOrders: activeOrders.count ?? 0,
    salesToday: Math.round(sales * 100) / 100,
  };
}

export type AdminOrder = Order & {
  order_items: OrderItem[];
  restaurants: { name: string; slug: string } | null;
};

export type AdminOrderFilter = "active" | "done" | "all";

export async function getAdminOrders(filter: AdminOrderFilter): Promise<AdminOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, slug)")
    .order("placed_at", { ascending: filter === "active" }) // active: oldest first
    .limit(50);

  if (filter === "active") query = query.in("status", ACTIVE_STATUSES);
  if (filter === "done") query = query.not("status", "in", `(${ACTIVE_STATUSES.join(",")})`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data ?? []) as AdminOrder[];
}
