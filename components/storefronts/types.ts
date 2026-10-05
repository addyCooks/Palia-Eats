import type { MenuCategory, MenuItem, Restaurant } from "@/types/app";

// Every storefront design (default or custom) receives exactly this data.
export type StorefrontProps = {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
};
