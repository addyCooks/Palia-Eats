import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRestaurantStatus, type RestaurantStatus } from "@/lib/utils/hours";

// Reads the menu for the WhatsApp bot. The bot runs on the server with no logged-in user,
// so it uses the service-role client and only ever reads public restaurant data.

export type BotRestaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  cuisine_tags: string[];
  delivery_fee: number;
  min_order_amount: number;
  status: RestaurantStatus;
};

export type BotCategory = { id: string; name: string };

export type BotItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  category_id: string | null;
};

const RESTAURANT_COLUMNS =
  "id, slug, name, tagline, cuisine_tags, delivery_fee, min_order_amount, is_accepting_orders, opening_time, closing_time, closed_days";

type RestaurantRow = Omit<BotRestaurant, "status"> & {
  is_accepting_orders: boolean;
  opening_time: string | null;
  closing_time: string | null;
  closed_days: number[] | null;
};

function toBotRestaurant(row: RestaurantRow): BotRestaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    cuisine_tags: row.cuisine_tags ?? [],
    delivery_fee: Number(row.delivery_fee),
    min_order_amount: Number(row.min_order_amount),
    status: getRestaurantStatus(row),
  };
}

export async function listRestaurants(): Promise<BotRestaurant[]> {
  const { data } = await createAdminClient()
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("is_active", true)
    .order("name");
  return (data ?? []).map((row) => toBotRestaurant(row as RestaurantRow));
}

export async function getRestaurant(id: string): Promise<BotRestaurant | null> {
  const { data } = await createAdminClient()
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  return data ? toBotRestaurant(data as RestaurantRow) : null;
}

export async function findRestaurantBySlug(slug: string): Promise<BotRestaurant | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data } = await createAdminClient()
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ? toBotRestaurant(data as RestaurantRow) : null;
}

// Only categories that have at least one dish customers can order right now.
export async function listCategories(restaurantId: string): Promise<BotCategory[]> {
  const admin = createAdminClient();
  const [categories, items] = await Promise.all([
    admin
      .from("menu_categories")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
    admin
      .from("menu_items")
      .select("category_id")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true),
  ]);
  const withItems = new Set((items.data ?? []).map((item) => item.category_id));
  return (categories.data ?? []).filter((category) => withItems.has(category.id));
}

export async function listItems(restaurantId: string, categoryId: string): Promise<BotItem[]> {
  const { data } = await createAdminClient()
    .from("menu_items")
    .select("id, name, description, price, is_veg, is_available, category_id")
    .eq("restaurant_id", restaurantId)
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("sort_order")
    .order("name");
  return (data ?? []).map((item) => ({ ...item, price: Number(item.price) }));
}

// Current details of specific dishes of this restaurant (used to price the cart live).
export async function getItems(restaurantId: string, ids: string[]): Promise<BotItem[]> {
  if (ids.length === 0) return [];
  const { data } = await createAdminClient()
    .from("menu_items")
    .select("id, name, description, price, is_veg, is_available, category_id")
    .eq("restaurant_id", restaurantId)
    .in("id", ids);
  return (data ?? []).map((item) => ({ ...item, price: Number(item.price) }));
}
