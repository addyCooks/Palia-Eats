import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem, Restaurant } from "@/types/app";

// Row Level Security makes sure these only ever return the logged-in customer's own hearts.

// What the restaurant page needs: is the restaurant hearted, and which of its dishes.
export type FavouriteState = { signedIn: boolean; restaurant: boolean; dishIds: string[] };

export async function getFavouriteState(restaurantId: string): Promise<FavouriteState> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, restaurant: false, dishIds: [] };

  const supabase = await createClient();
  const [restaurant, dishes] = await Promise.all([
    supabase.from("favourite_restaurants").select("restaurant_id").eq("restaurant_id", restaurantId).maybeSingle(),
    supabase
      .from("favourite_dishes")
      .select("menu_item_id, menu_items!inner(restaurant_id)")
      .eq("menu_items.restaurant_id", restaurantId),
  ]);

  // Favourites are a nice-to-have: if they can't be read, the page still works.
  return {
    signedIn: true,
    restaurant: Boolean(restaurant.data),
    dishIds: (dishes.data ?? []).map((row) => row.menu_item_id as string),
  };
}

export type FavouriteRestaurant = Restaurant;
export type FavouriteDish = MenuItem & { restaurants: Pick<Restaurant, "name" | "slug"> };

// Account -> Favourites, newest first. Restaurants hidden from the website drop out.
export async function getMyFavourites(): Promise<{ restaurants: FavouriteRestaurant[]; dishes: FavouriteDish[] }> {
  const supabase = await createClient();
  const [restaurants, dishes] = await Promise.all([
    supabase
      .from("favourite_restaurants")
      .select("created_at, restaurants!inner(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("favourite_dishes")
      .select("created_at, menu_items!inner(*, restaurants!inner(name, slug))")
      .order("created_at", { ascending: false }),
  ]);

  if (restaurants.error) throw new Error(`Could not load favourites: ${restaurants.error.message}`);
  if (dishes.error) throw new Error(`Could not load favourites: ${dishes.error.message}`);

  const one = <T,>(value: T | T[]): T => (Array.isArray(value) ? value[0] : value);
  return {
    restaurants: restaurants.data.map((row) => one(row.restaurants) as FavouriteRestaurant),
    dishes: dishes.data.map((row) => one(row.menu_items) as FavouriteDish),
  };
}
