import { createClient } from "@/lib/supabase/server";
import type { OrderItem, OrderRating, OrderStatusEvent, OrderWithDetails } from "@/types/app";

// Row Level Security makes sure customers only ever get their own orders (and only the
// rider and status history of their own orders).
const ORDER_SELECT = "*, order_items(*, menu_items(image_url)), restaurants(name, slug, phone, logo_url, cover_url), riders(name, phone)";

export type CustomerOrder = Omit<OrderWithDetails, "order_items" | "restaurants"> & {
  order_items: (OrderItem & { menu_items: { image_url: string | null } | null })[];
  restaurants: {
    name: string;
    slug: string;
    phone: string | null;
    logo_url: string | null;
    cover_url: string | null;
  } | null;
  riders: { name: string; phone: string } | null;
};

export async function getMyOrders(): Promise<(CustomerOrder & { rated: boolean })[]> {
  const supabase = await createClient();
  const [{ data, error }, ratings] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).order("placed_at", { ascending: false }).limit(50),
    supabase.from("order_ratings").select("order_id").limit(200),
  ]);

  if (error) throw new Error(`Could not load orders: ${error.message}`);
  const rated = new Set((ratings.data ?? []).map((row) => row.order_id));
  return ((data ?? []) as CustomerOrder[]).map((order) => ({ ...order, rated: rated.has(order.id) }));
}

export async function getMyOrder(id: string) {
  const supabase = await createClient();
  const [order, events, rating] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle(),
    supabase.from("order_status_events").select("status, at").eq("order_id", id).order("at"),
    supabase.from("order_ratings").select("order_id, stars, comment, created_at").eq("order_id", id).maybeSingle(),
  ]);

  if (order.error) throw new Error(`Could not load order: ${order.error.message}`);
  if (!order.data) return null;
  return {
    order: order.data as CustomerOrder,
    events: (events.data ?? []) as OrderStatusEvent[],
    rating: (rating.data ?? null) as OrderRating | null,
  };
}

export type ActiveOrderSummary = {
  id: string;
  order_number: number;
  status: OrderWithDetails["status"];
  restaurantName: string;
};

// The customer's newest order that is still on its way (or null). Powers the "Order #12 ·
// Cooking · Track" strip. Row Level Security limits this to their own orders.
export async function getMyActiveOrder(): Promise<ActiveOrderSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, restaurants(name)")
    .in("status", ["pending", "accepted", "preparing", "out_for_delivery"])
    .order("placed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const restaurant = Array.isArray(data.restaurants) ? data.restaurants[0] : data.restaurants;
  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    restaurantName: restaurant?.name ?? "your restaurant",
  };
}
