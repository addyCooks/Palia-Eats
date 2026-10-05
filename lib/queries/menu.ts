import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuItem } from "@/types/app";

// Admin reads of a restaurant's whole menu (includes sold-out items).
export async function getAdminMenu(restaurantId: string) {
  const supabase = await createClient();

  const [categories, items] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
  ]);

  if (categories.error) throw new Error(`Could not load categories: ${categories.error.message}`);
  if (items.error) throw new Error(`Could not load menu items: ${items.error.message}`);

  return {
    categories: (categories.data ?? []) as MenuCategory[],
    items: (items.data ?? []) as MenuItem[],
  };
}

export async function getAdminMenuItem(
  restaurantId: string,
  itemId: string,
): Promise<MenuItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) throw new Error(`Could not load menu item: ${error.message}`);
  return data as MenuItem | null;
}
