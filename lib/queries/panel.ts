import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
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
