import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
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

// ---------------------------------------------------------------- customers

export type AdminCustomer = {
  id: string;
  role: "customer" | "admin";
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  orderCount: number;
  spent: number; // excludes cancelled orders
  lastOrderAt: string | null;
};

// Customer emails live in the auth system, which only the service-role key can read.
// Layouts and pages render in parallel, so this checks for an admin itself.
async function emailsById(): Promise<Map<string, string>> {
  await requireAdmin();
  const { data, error } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Could not load customer emails: ${error.message}`);
  return new Map(data.users.filter((user) => user.email).map((user) => [user.id, user.email as string]));
}

export async function getAdminCustomers(search: string): Promise<AdminCustomer[]> {
  const supabase = await createClient();
  const [profiles, orders, emails] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, phone, created_at").limit(1000),
    supabase.from("orders").select("customer_id, total, status, placed_at").limit(10000),
    emailsById(),
  ]);
  if (profiles.error) throw new Error(`Could not load customers: ${profiles.error.message}`);
  if (orders.error) throw new Error(`Could not load customers: ${orders.error.message}`);

  const stats = new Map<string, { count: number; spent: number; last: string | null }>();
  for (const order of orders.data ?? []) {
    const entry = stats.get(order.customer_id) ?? { count: 0, spent: 0, last: null };
    entry.count++;
    if (order.status !== "cancelled" && order.status !== "rejected") entry.spent += Number(order.total);
    if (!entry.last || order.placed_at > entry.last) entry.last = order.placed_at;
    stats.set(order.customer_id, entry);
  }

  const needle = search.trim().toLowerCase();
  return (profiles.data ?? [])
    .map((profile) => {
      const entry = stats.get(profile.id);
      return {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        phone: profile.phone,
        email: emails.get(profile.id) ?? null,
        created_at: profile.created_at ?? null,
        orderCount: entry?.count ?? 0,
        spent: Math.round((entry?.spent ?? 0) * 100) / 100,
        lastOrderAt: entry?.last ?? null,
      } satisfies AdminCustomer;
    })
    .filter(
      (customer) =>
        !needle ||
        [customer.full_name, customer.phone, customer.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
    )
    .sort((a, b) => (b.lastOrderAt ?? b.created_at ?? "").localeCompare(a.lastOrderAt ?? a.created_at ?? ""));
}

export async function getAdminCustomer(id: string) {
  const supabase = await createClient();
  const [profile, addresses, orders, emails] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, phone, created_at").eq("id", id).maybeSingle(),
    supabase.from("customer_addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select("*, order_items(*), restaurants(name, slug)")
      .eq("customer_id", id)
      .order("placed_at", { ascending: false })
      .limit(50),
    emailsById(),
  ]);
  if (profile.error || addresses.error || orders.error) throw new Error("Could not load the customer.");
  if (!profile.data) return null;

  return {
    profile: profile.data,
    email: emails.get(id) ?? null,
    addresses: addresses.data ?? [],
    orders: (orders.data ?? []) as AdminOrder[],
  };
}

// ---------------------------------------------------------------- statistics

export type RestaurantStat = { name: string; orders: number; sales: number; cancelled: number };
export type ChannelStat = { channel: string; orders: number; sales: number };

// Last 30 days, split by restaurant and by where the order came from.
export async function getAdminBreakdown() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("total, status, channel, restaurants(name)")
    .gte("placed_at", since)
    .limit(10000);
  if (error) throw new Error(`Could not load statistics: ${error.message}`);

  const byRestaurant = new Map<string, RestaurantStat>();
  const byChannel = new Map<string, ChannelStat>();
  for (const order of data ?? []) {
    const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
    const name = restaurant?.name ?? "Unknown";
    const cancelled = order.status === "cancelled" || order.status === "rejected";
    const amount = cancelled ? 0 : Number(order.total);

    const r = byRestaurant.get(name) ?? { name, orders: 0, sales: 0, cancelled: 0 };
    r.orders++;
    r.sales += amount;
    if (cancelled) r.cancelled++;
    byRestaurant.set(name, r);

    const c = byChannel.get(order.channel) ?? { channel: order.channel, orders: 0, sales: 0 };
    c.orders++;
    c.sales += amount;
    byChannel.set(order.channel, c);
  }

  const round = <T extends { sales: number }>(row: T) => ({ ...row, sales: Math.round(row.sales * 100) / 100 });
  return {
    restaurants: [...byRestaurant.values()].map(round).sort((a, b) => b.sales - a.sales),
    channels: [...byChannel.values()].map(round).sort((a, b) => b.orders - a.orders),
  };
}

// ------------------------------------------------------------ notification log

export type NotificationRow = {
  id: string;
  order_id: string | null;
  channel: string;
  recipient_type: string;
  event: string;
  recipient: string | null;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  attempts: number;
  created_at: string;
  orders: { order_number: number } | null;
};

export async function getNotificationLog(onlyProblems: boolean): Promise<NotificationRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notification_log")
    .select("*, orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (onlyProblems) query = query.in("status", ["failed", "skipped"]);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load the notification log: ${error.message}`);
  return (data ?? []) as unknown as NotificationRow[];
}

export async function countRecentNotificationProblems(): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .in("status", ["failed", "skipped"])
    .gte("created_at", since);
  return count ?? 0;
}
