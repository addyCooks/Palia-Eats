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

export type PublicDish = MenuItem & {
  restaurants: { name: string; slug: string; rating_avg: number | null; theme: Restaurant["theme"] };
};

// Dishes for the home page and search: available dishes of visible restaurants.
// Without a search: bestsellers first. With one: dish names and descriptions that match.
export async function getPublicDishes({ search = "", limit = 8 }: { search?: string; limit?: number } = {}) {
  const supabase = await createClient();
  // Keep only characters that can't break the filter syntax.
  const q = search.replace(/[^\p{L}\p{N} '-]/gu, "").trim().slice(0, 40);

  let query = supabase
    .from("menu_items")
    .select("*, restaurants!inner(name, slug, rating_avg, theme, is_active)")
    .eq("is_available", true)
    .eq("restaurants.is_active", true)
    .order("is_bestseller", { ascending: false })
    .order("sort_order")
    .limit(limit);
  if (q) query = query.or(`name.ilike.*${q}*,description.ilike.*${q}*`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load dishes: ${error.message}`);
  return { dishes: (data ?? []) as PublicDish[], query: q };
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
