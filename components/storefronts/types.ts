import type { FavouriteState } from "@/lib/queries/favourites";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/app";

// Every storefront design (default or custom) receives exactly this data.
export type StorefrontProps = {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  // The visitor's hearts (restaurant and dishes). Custom designs may ignore it.
  favourites: FavouriteState;
};
