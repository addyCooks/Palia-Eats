import { createClient } from "@/lib/supabase/client";
import { EMPTY_CART, type Cart, type CartItem } from "@/lib/cart/cart";
import { formatPrice } from "@/lib/utils/format";
import { getRestaurantStatus, type RestaurantStatus } from "@/lib/utils/hours";

export type CartSyncResult = {
  cart: Cart; // the cart updated with the restaurant's current menu
  notices: string[]; // human-readable list of what changed
  status: RestaurantStatus | null; // open / closed / paused (null if we couldn't check)
};

// Compares the saved cart with the live menu: updates changed prices and the delivery
// fee, removes sold-out or deleted items. The server re-checks everything again when
// the order is placed; this only makes sure the customer sees accurate numbers first.
export async function syncCartWithServer(cart: Cart): Promise<CartSyncResult> {
  const restaurant = cart.restaurant;
  if (!restaurant || cart.items.length === 0) {
    return { cart, notices: [], status: null };
  }

  const supabase = createClient();
  const [restaurantResult, itemsResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("delivery_fee, min_order_amount, is_accepting_orders, opening_time, closing_time")
      .eq("id", restaurant.id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("menu_items")
      .select("id, name, price, is_available")
      .eq("restaurant_id", restaurant.id)
      .in("id", cart.items.map((item) => item.menuItemId)),
  ]);

  // Couldn't reach the server: keep the cart as it is (the server will still check).
  if (restaurantResult.error || itemsResult.error) {
    return { cart, notices: [], status: null };
  }

  if (!restaurantResult.data) {
    return {
      cart: EMPTY_CART,
      notices: [`${restaurant.name} isn't available right now, so your cart was cleared.`],
      status: null,
    };
  }

  const live = restaurantResult.data;
  const notices: string[] = [];
  const liveItems = new Map((itemsResult.data ?? []).map((item) => [item.id, item]));

  const items: CartItem[] = [];
  for (const line of cart.items) {
    const current = liveItems.get(line.menuItemId);
    if (!current || !current.is_available) {
      notices.push(`${line.name} is no longer available and was removed.`);
      continue;
    }
    if (current.price !== line.price) {
      notices.push(
        `The price of ${line.name} changed from ${formatPrice(line.price)} to ${formatPrice(current.price)}.`,
      );
    }
    items.push({ ...line, name: current.name, price: current.price });
  }

  if (live.delivery_fee !== restaurant.deliveryFee) {
    notices.push(`The delivery fee is now ${formatPrice(live.delivery_fee)}.`);
  }

  const updated: Cart =
    items.length === 0
      ? EMPTY_CART
      : {
          restaurant: {
            ...restaurant,
            deliveryFee: live.delivery_fee,
            minOrderAmount: live.min_order_amount,
          },
          items,
        };

  return { cart: updated, notices, status: getRestaurantStatus(live) };
}
