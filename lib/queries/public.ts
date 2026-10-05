import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/app";

// Reads for the public website. Only restaurants marked visible are returned.

export async function getActiveRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Could not load restaurants: ${error.message}`);
  return (data ?? []) as Restaurant[];
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load restaurant: ${error.message}`);
  return data as Restaurant | null;
}

export async function getPublicMenu(restaurantId: string) {
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

  if (categories.error) throw new Error(`Could not load menu: ${categories.error.message}`);
  if (items.error) throw new Error(`Could not load menu: ${items.error.message}`);

  return {
    categories: (categories.data ?? []) as MenuCategory[],
    items: (items.data ?? []) as MenuItem[],
  };
}
