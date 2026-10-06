import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import {
  addDaysToKey,
  istDateKey,
  istDayStart,
  istHour,
  mondayOfKey,
  startOfTodayIST,
  todayKeyIST,
} from "@/lib/utils/time";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { ACTIVE_STATUSES, CANCELLED_STATUSES } from "@/lib/orders/status";
import { average, minutesBetween, type StatusEventRow } from "@/lib/orders/stats";
import type {
  Address,
  Order,
  OrderItem,
  OrderRating,
  OrderStatus,
  OrderStatusEvent,
  Restaurant,
  RestaurantPayout,
  Rider,
} from "@/types/app";

// Admin-only reads. They use the logged-in admin's session, so database rules
// (RLS) decide what is visible; no special key is needed (except customer emails and
// the blocked flag, see below).

const cancelledList = `(${CANCELLED_STATUSES.join(",")})`;
const isCancelled = (status: string) => CANCELLED_STATUSES.includes(status as OrderStatus);

// Keep only characters that can't break PostgREST's filter syntax.
function cleanSearch(search: string) {
  return search.replace(/[^\p{L}\p{N} .'+-]/gu, "").trim().slice(0, 40);
}

async function eventsFor(orderIds: string[]): Promise<StatusEventRow[]> {
  if (orderIds.length === 0) return [];
  const supabase = await createClient();
  const rows: StatusEventRow[] = [];
  for (let i = 0; i < orderIds.length; i += 150) {
    const { data } = await supabase
      .from("order_status_events")
      .select("order_id, status, at")
      .in("order_id", orderIds.slice(i, i + 150));
    rows.push(...((data ?? []) as StatusEventRow[]));
  }
  return rows;
}

// ---------------------------------------------------------------- dashboard

export type DashboardRange = "today" | "week" | "month";

export async function getAdminDashboard(range: DashboardRange) {
  const supabase = await createClient();
  const todayKey = todayKeyIST();
  const days = range === "today" ? 1 : range === "week" ? 7 : 30;
  const startKey = addDaysToKey(todayKey, -(days - 1));
  const prevStartKey = addDaysToKey(startKey, -days);
  const start = istDayStart(startKey);

  const [orders, restaurants, active] = await Promise.all([
    supabase
      .from("orders")
      .select("id, restaurant_id, status, total, placed_at, restaurants(name)")
      .gte("placed_at", istDayStart(prevStartKey))
      .limit(20000),
    supabase.from("restaurants").select("*").eq("is_active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ACTIVE_STATUSES),
  ]);
  if (orders.error) throw new Error(`Could not load the dashboard: ${orders.error.message}`);
  if (restaurants.error) throw new Error(`Could not load the dashboard: ${restaurants.error.message}`);

  type Row = { id: string; restaurant_id: string; status: OrderStatus; total: number; placed_at: string; restaurants: { name: string } | { name: string }[] | null };
  const rows = (orders.data ?? []) as Row[];
  const current = rows.filter((row) => row.placed_at >= start);
  let previousRows = rows.filter((row) => row.placed_at < start);
  // "Today" is compared with the same weekday last week (busy days look like busy days).
  if (range === "today") {
    const { data } = await supabase
      .from("orders")
      .select("id, restaurant_id, status, total, placed_at, restaurants(name)")
      .gte("placed_at", istDayStart(addDaysToKey(todayKey, -7)))
      .lt("placed_at", istDayStart(addDaysToKey(todayKey, -6)))
      .limit(20000);
    previousRows = (data ?? []) as Row[];
  }

  const live = (list: Row[]) => list.filter((row) => !isCancelled(row.status));
  const revenue = (list: Row[]) => live(list).reduce((sum, row) => sum + Number(row.total), 0);

  const [eventsNow, eventsBefore] = await Promise.all([
    eventsFor(current.filter((row) => row.status === "delivered").map((row) => row.id)),
    eventsFor(previousRows.filter((row) => row.status === "delivered").map((row) => row.id)),
  ]);
  const deliveryNow = average(minutesBetween(eventsNow, "pending", "delivered"));
  const deliveryBefore = average(minutesBetween(eventsBefore, "pending", "delivered"));

  const restaurantList = (restaurants.data ?? []) as Restaurant[];
  const openNow = restaurantList.filter((restaurant) => getRestaurantStatus(restaurant).canOrder).length;

  // Orders by hour of the day (Indian time), 11 am to 10 pm plus any busier edges.
  const byHour = new Map<number, number>();
  for (const row of live(current)) byHour.set(istHour(row.placed_at), (byHour.get(istHour(row.placed_at)) ?? 0) + 1);
  const hours = [...byHour.keys()];
  const first = Math.min(11, ...hours);
  const last = Math.max(22, ...hours);
  const hourBars = Array.from({ length: last - first + 1 }, (_, i) => {
    const hour = first + i;
    return { hour, label: String(hour % 12 === 0 ? 12 : hour % 12), orders: byHour.get(hour) ?? 0 };
  });

  const byRestaurant = new Map<string, { name: string; orders: number }>();
  for (const row of live(current)) {
    const restaurant = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
    const entry = byRestaurant.get(row.restaurant_id) ?? { name: restaurant?.name ?? "Restaurant", orders: 0 };
    entry.orders++;
    byRestaurant.set(row.restaurant_id, entry);
  }

  return {
    orders: { now: live(current).length, before: live(previousRows).length },
    revenue: { now: revenue(current), before: revenue(previousRows) },
    restaurants: { open: openNow, total: restaurantList.length },
    delivery: { now: deliveryNow, before: deliveryBefore },
    activeOrders: active.count ?? 0,
    hourBars,
    topRestaurants: [...byRestaurant.values()].sort((a, b) => b.orders - a.orders).slice(0, 5),
  };
}

// ---------------------------------------------------------------- orders

export type AdminOrder = Order & {
  order_items: OrderItem[];
  restaurants: { name: string; slug: string } | null;
  riders: { name: string } | null;
};

export type AdminOrderFilter = "all" | "new" | "cooking" | "way" | "delivered" | "cancelled";
export const ADMIN_PAGE_SIZE = 20;

export async function getAdminOrders({
  filter,
  search,
  page,
}: {
  filter: AdminOrderFilter;
  search: string;
  page: number;
}) {
  const supabase = await createClient();
  const q = cleanSearch(search);

  let query = supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, slug), riders(name)", { count: "exact" })
    .order("placed_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);

  if (filter === "new") query = query.in("status", ["pending", "accepted"]);
  if (filter === "cooking") query = query.eq("status", "preparing");
  if (filter === "way") query = query.eq("status", "out_for_delivery");
  if (filter === "delivered") query = query.eq("status", "delivered");
  if (filter === "cancelled") query = query.in("status", CANCELLED_STATUSES);

  if (q) {
    if (/^\d{1,9}$/.test(q)) {
      query = query.or(`order_number.eq.${q},customer_phone.ilike.*${q}*`);
    } else {
      // Customer name, or any restaurant whose name matches.
      const { data: matches } = await supabase.from("restaurants").select("id").ilike("name", `%${q}%`).limit(50);
      const ids = (matches ?? []).map((row) => row.id);
      query = query.or(
        [`customer_name.ilike.*${q}*`, ids.length ? `restaurant_id.in.(${ids.join(",")})` : null]
          .filter(Boolean)
          .join(","),
      );
    }
  }

  const [{ data, count, error }, today, restaurantsToday] = await Promise.all([
    query,
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("placed_at", startOfTodayIST()),
    supabase.from("orders").select("restaurant_id").gte("placed_at", startOfTodayIST()).limit(5000),
  ]);
  if (error) throw new Error(`Could not load orders: ${error.message}`);

  return {
    orders: (data ?? []) as AdminOrder[],
    total: count ?? 0,
    today: today.count ?? 0,
    restaurantsToday: new Set((restaurantsToday.data ?? []).map((row) => row.restaurant_id)).size,
  };
}

export async function getAdminOrder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, slug, phone), riders(id, name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the order: ${error.message}`);
  if (!data) return null;

  const [events, rating, riders] = await Promise.all([
    supabase.from("order_status_events").select("status, at").eq("order_id", id).order("at"),
    supabase.from("order_ratings").select("order_id, stars, comment, created_at").eq("order_id", id).maybeSingle(),
    supabase
      .from("riders")
      .select("*")
      .eq("is_active", true)
      .or(`restaurant_id.is.null,restaurant_id.eq.${data.restaurant_id}`)
      .order("name"),
  ]);

  return {
    order: data as Order & {
      order_items: OrderItem[];
      restaurants: { name: string; slug: string; phone: string | null } | null;
      riders: { id: string; name: string; phone: string } | null;
    },
    events: (events.data ?? []) as OrderStatusEvent[],
    rating: (rating.data ?? null) as OrderRating | null,
    riders: (riders.data ?? []) as Rider[],
  };
}

// ---------------------------------------------------------------- restaurants

export type RestaurantFilter = "all" | "live" | "paused" | "pending";

export type RestaurantRow = Restaurant & {
  owner_name: string | null;
  notification_email: string | null;
  ordersThisWeek: number;
  state: "Live" | "Paused" | "Pending";
};

export async function getAdminRestaurantsTable({ filter, search }: { filter: RestaurantFilter; search: string }) {
  const supabase = await createClient();
  const since = istDayStart(addDaysToKey(todayKeyIST(), -6));
  const [restaurants, orders] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*, restaurant_private(owner_name, notification_email)")
      .order("name"),
    supabase.from("orders").select("restaurant_id").gte("placed_at", since).not("status", "in", cancelledList).limit(20000),
  ]);
  if (restaurants.error) throw new Error(`Could not load restaurants: ${restaurants.error.message}`);

  const weekly = new Map<string, number>();
  for (const row of orders.data ?? []) weekly.set(row.restaurant_id, (weekly.get(row.restaurant_id) ?? 0) + 1);

  const all: RestaurantRow[] = (restaurants.data ?? []).map((row) => {
    const priv = Array.isArray(row.restaurant_private) ? row.restaurant_private[0] : row.restaurant_private;
    const { restaurant_private: _ignored, ...restaurant } = row;
    void _ignored;
    return {
      ...(restaurant as Restaurant),
      owner_name: priv?.owner_name ?? null,
      notification_email: priv?.notification_email ?? null,
      ordersThisWeek: weekly.get(row.id) ?? 0,
      state: !row.is_active ? "Pending" : row.is_accepting_orders ? "Live" : "Paused",
    };
  });

  const needle = search.trim().toLowerCase();
  const rows = all
    .filter((row) => filter === "all" || row.state.toLowerCase() === filter)
    .filter(
      (row) =>
        !needle ||
        [row.name, row.owner_name ?? "", row.area ?? ""].some((value) => value.toLowerCase().includes(needle)),
    )
    .sort((a, b) => b.ordersThisWeek - a.ordersThisWeek || a.name.localeCompare(b.name));

  return {
    rows,
    total: all.length,
    pending: all.filter((row) => row.state === "Pending").length,
  };
}

// The Monday-to-Sunday week a payout covers, with what is owed for it.
export type PayoutWeek = {
  weekStart: string; // "2026-09-28"
  weekEnd: string;
  gross: number; // delivered orders' totals
  commissionPercent: number;
  commission: number;
  net: number;
};

export function settleWeek(gross: number, commissionPercent: number, weekStart: string): PayoutWeek {
  const commission = Math.round(gross * commissionPercent) / 100;
  return {
    weekStart,
    weekEnd: addDaysToKey(weekStart, 6),
    gross: Math.round(gross * 100) / 100,
    commissionPercent,
    commission,
    net: Math.round((gross - commission) * 100) / 100,
  };
}

export async function getAdminRestaurantDetail(id: string) {
  const supabase = await createClient();
  const todayKey = todayKeyIST();
  const thisMonday = mondayOfKey(todayKey);
  const lastMonday = addDaysToKey(thisMonday, -7);

  const [restaurant, orders, recent, payouts] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*, restaurant_private(owner_name, commission_percent, notification_email)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, status, total, placed_at")
      .eq("restaurant_id", id)
      // 30 days covers last week, this week and the prep-time average.
      .gte("placed_at", istDayStart(addDaysToKey(todayKey, -29)))
      .limit(20000),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total, status, placed_at")
      .eq("restaurant_id", id)
      .order("placed_at", { ascending: false })
      .limit(6),
    supabase
      .from("restaurant_payouts")
      .select("*")
      .eq("restaurant_id", id)
      .order("week_start", { ascending: false })
      .limit(6),
  ]);
  if (restaurant.error) throw new Error(`Could not load the restaurant: ${restaurant.error.message}`);
  if (!restaurant.data) return null;

  const priv = Array.isArray(restaurant.data.restaurant_private)
    ? restaurant.data.restaurant_private[0]
    : restaurant.data.restaurant_private;
  const commissionPercent = Number(priv?.commission_percent ?? 8);

  type Row = { id: string; status: OrderStatus; total: number; placed_at: string };
  const rows = (orders.data ?? []) as Row[];
  const inWeek = (monday: string) =>
    rows.filter((row) => {
      const key = istDateKey(row.placed_at);
      return key >= monday && key <= addDaysToKey(monday, 6);
    });
  const deliveredTotal = (list: Row[]) =>
    list.filter((row) => row.status === "delivered").reduce((sum, row) => sum + Number(row.total), 0);

  const thisWeek = inWeek(thisMonday);
  const lastWeek = inWeek(lastMonday);
  const paid = (payouts.data ?? []) as RestaurantPayout[];
  const lastWeekPaid = paid.some((payout) => payout.week_start === lastMonday);

  // Average prep time over the last 30 days (cooking -> handed to rider).
  const events = await eventsFor(
    rows.filter((row) => row.status === "delivered" || row.status === "out_for_delivery").map((row) => row.id),
  );

  return {
    restaurant: restaurant.data as Restaurant,
    ownerName: (priv?.owner_name as string | null) ?? null,
    notificationEmail: (priv?.notification_email as string | null) ?? null,
    commissionPercent,
    week: {
      orders: thisWeek.filter((row) => !isCancelled(row.status)).length,
      revenue: deliveredTotal(thisWeek),
    },
    avgPrep: average(minutesBetween(events, "preparing", "out_for_delivery")),
    recent: (recent.data ?? []) as {
      id: string;
      order_number: number;
      customer_name: string;
      total: number;
      status: OrderStatus;
      placed_at: string;
    }[],
    payouts: paid,
    current: settleWeek(deliveredTotal(thisWeek), commissionPercent, thisMonday),
    due: lastWeekPaid ? null : settleWeek(deliveredTotal(lastWeek), commissionPercent, lastMonday),
  };
}

// ---------------------------------------------------------------- customers

export type CustomerFilter = "all" | "new" | "frequent" | "blocked";
export const FREQUENT_ORDERS = 5;

export type AdminCustomer = {
  id: string;
  role: "customer" | "admin";
  full_name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_phone: string | null;
  created_at: string | null;
  is_blocked: boolean;
  area: string | null;
  orderCount: number;
  spent: number; // excludes cancelled orders
  lastOrderAt: string | null;
  state: "Active" | "New" | "Blocked";
};

// Customer emails live in the auth system, which only the service-role key can read.
// Layouts and pages render in parallel, so this checks for an admin itself.
async function emailsById(): Promise<Map<string, string>> {
  await requireAdmin();
  const { data, error } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Could not load customer emails: ${error.message}`);
  // WhatsApp customers have a made-up, undeliverable address: don't show it as an email.
  return new Map(
    data.users
      .filter((user) => user.email && !user.email.endsWith("@whatsapp.invalid"))
      .map((user) => [user.id, user.email as string]),
  );
}

// "Ward 4, near the temple" -> a short place name for the table.
function shortArea(address: { landmark: string | null; address_line: string } | undefined): string | null {
  if (!address) return null;
  const text = address.landmark?.trim() || address.address_line.split(/[,\n]/).map((part) => part.trim()).filter(Boolean).pop();
  return text ? text.slice(0, 40) : null;
}

export async function getAdminCustomers({
  filter,
  search,
  page,
}: {
  filter: CustomerFilter;
  search: string;
  page: number;
}) {
  const supabase = await createClient();
  const [profiles, orders, addresses, emails] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, phone, whatsapp_phone, created_at, is_blocked").limit(5000),
    supabase.from("orders").select("customer_id, total, status, placed_at").limit(20000),
    supabase.from("customer_addresses").select("user_id, landmark, address_line, phone, is_default").limit(10000),
    emailsById(),
  ]);
  if (profiles.error) throw new Error(`Could not load customers: ${profiles.error.message}`);
  if (orders.error) throw new Error(`Could not load customers: ${orders.error.message}`);

  const stats = new Map<string, { count: number; spent: number; last: string | null }>();
  for (const order of orders.data ?? []) {
    const entry = stats.get(order.customer_id) ?? { count: 0, spent: 0, last: null };
    entry.count++;
    if (!isCancelled(order.status)) entry.spent += Number(order.total);
    if (!entry.last || order.placed_at > entry.last) entry.last = order.placed_at;
    stats.set(order.customer_id, entry);
  }

  const homes = new Map<string, { landmark: string | null; address_line: string; phone: string | null }>();
  for (const address of addresses.data ?? []) {
    if (!homes.has(address.user_id) || address.is_default) homes.set(address.user_id, address);
  }

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const all: AdminCustomer[] = (profiles.data ?? []).map((profile) => {
    const entry = stats.get(profile.id);
    const isNew = (profile.created_at ?? "") >= weekAgo;
    return {
      id: profile.id,
      role: profile.role,
      full_name: profile.full_name,
      // Their account phone, else the one on their default address.
      phone: profile.phone ?? homes.get(profile.id)?.phone ?? null,
      email: emails.get(profile.id) ?? null,
      whatsapp_phone: profile.whatsapp_phone ?? null,
      created_at: profile.created_at ?? null,
      is_blocked: Boolean(profile.is_blocked),
      area: shortArea(homes.get(profile.id)),
      orderCount: entry?.count ?? 0,
      spent: Math.round((entry?.spent ?? 0) * 100) / 100,
      lastOrderAt: entry?.last ?? null,
      state: profile.is_blocked ? "Blocked" : isNew ? "New" : "Active",
    };
  });

  const needle = search.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const filtered = all
    .filter((customer) => {
      if (filter === "new") return customer.state === "New";
      if (filter === "frequent") return customer.orderCount >= FREQUENT_ORDERS;
      if (filter === "blocked") return customer.is_blocked;
      return true;
    })
    .filter(
      (customer) =>
        !needle ||
        [customer.full_name, customer.email].some((value) => value?.toLowerCase().includes(needle)) ||
        (digits.length >= 3 &&
          [customer.phone, customer.whatsapp_phone].some((value) => value?.replace(/\D/g, "").includes(digits))),
    )
    .sort((a, b) => (b.lastOrderAt ?? b.created_at ?? "").localeCompare(a.lastOrderAt ?? a.created_at ?? ""));

  return {
    customers: filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE),
    matching: filtered.length,
    registered: all.filter((customer) => customer.role === "customer").length,
    newThisWeek: all.filter((customer) => customer.role === "customer" && customer.state === "New").length,
  };
}

export async function getAdminCustomer(id: string) {
  const supabase = await createClient();
  const [profile, addresses, orders, emails] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, phone, whatsapp_phone, created_at, is_blocked")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("customer_addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select("*, order_items(*), restaurants(name, slug), riders(name)")
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
    addresses: (addresses.data ?? []) as Address[],
    orders: (orders.data ?? []) as AdminOrder[],
  };
}

// ---------------------------------------------------------------- riders

export type RiderRow = Rider & { restaurantName: string | null; delivered: number; onTheWay: number };

export async function getRiders() {
  const supabase = await createClient();
  const [riders, restaurants, orders] = await Promise.all([
    supabase.from("riders").select("*").order("is_active", { ascending: false }).order("name"),
    supabase.from("restaurants").select("id, name").order("name"),
    supabase
      .from("orders")
      .select("rider_id, status")
      .not("rider_id", "is", null)
      .gte("placed_at", istDayStart(addDaysToKey(todayKeyIST(), -29)))
      .limit(20000),
  ]);
  if (riders.error) throw new Error(`Could not load riders: ${riders.error.message}`);

  const names = new Map((restaurants.data ?? []).map((row) => [row.id, row.name]));
  const delivered = new Map<string, number>();
  const onTheWay = new Map<string, number>();
  for (const row of orders.data ?? []) {
    if (!row.rider_id) continue;
    if (row.status === "delivered") delivered.set(row.rider_id, (delivered.get(row.rider_id) ?? 0) + 1);
    if (row.status === "out_for_delivery") onTheWay.set(row.rider_id, (onTheWay.get(row.rider_id) ?? 0) + 1);
  }

  return {
    riders: ((riders.data ?? []) as Rider[]).map((rider) => ({
      ...rider,
      restaurantName: rider.restaurant_id ? (names.get(rider.restaurant_id) ?? "Restaurant") : null,
      delivered: delivered.get(rider.id) ?? 0,
      onTheWay: onTheWay.get(rider.id) ?? 0,
    })) as RiderRow[],
    restaurants: (restaurants.data ?? []) as { id: string; name: string }[],
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
