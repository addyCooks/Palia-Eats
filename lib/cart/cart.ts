import type { Restaurant } from "@/types/app";

// ---- Types -----------------------------------------------------------------
// The cart is kept in the visitor's browser. Prices here are for DISPLAY only:
// at checkout the server re-reads real prices from the database.

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  isVeg: boolean;
  quantity: number;
};

export type CartRestaurant = {
  id: string;
  slug: string;
  name: string;
  deliveryFee: number;
  minOrderAmount: number;
};

export type Cart = {
  restaurant: CartRestaurant | null;
  items: CartItem[];
};

export const MAX_QUANTITY_PER_ITEM = 20;

export const EMPTY_CART: Cart = { restaurant: null, items: [] };

// ---- Helpers ---------------------------------------------------------------

// Money math in paise (whole numbers) so 0.1 + 0.2 style errors can't happen.
const toPaise = (rupees: number) => Math.round(rupees * 100);
const fromPaise = (paise: number) => paise / 100;

export function toCartRestaurant(
  restaurant: Pick<Restaurant, "id" | "slug" | "name" | "delivery_fee" | "min_order_amount">,
): CartRestaurant {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    deliveryFee: restaurant.delivery_fee,
    minOrderAmount: restaurant.min_order_amount,
  };
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

export function cartSubtotal(cart: Cart): number {
  const paise = cart.items.reduce((total, item) => total + toPaise(item.price) * item.quantity, 0);
  return fromPaise(paise);
}

export function cartTotal(cart: Cart): number {
  const delivery = cart.restaurant ? toPaise(cart.restaurant.deliveryFee) : 0;
  return fromPaise(toPaise(cartSubtotal(cart)) + delivery);
}

// True when adding from `restaurantId` would mix two restaurants in one cart.
export function isOtherRestaurant(cart: Cart, restaurantId: string): boolean {
  return cart.items.length > 0 && cart.restaurant?.id !== restaurantId;
}

// ---- Changes (each returns a NEW cart; nothing is edited in place) ----------

// Adds one of an item. If the cart belongs to another restaurant it is replaced,
// so ask the visitor first (see AddToCartButton).
export function addToCart(
  cart: Cart,
  restaurant: CartRestaurant,
  item: { id: string; name: string; price: number; isVeg: boolean },
): Cart {
  const base: Cart = isOtherRestaurant(cart, restaurant.id) ? EMPTY_CART : cart;
  const existing = base.items.find((line) => line.menuItemId === item.id);

  const items = existing
    ? base.items.map((line) =>
        line.menuItemId === item.id
          ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY_PER_ITEM) }
          : line,
      )
    : [
        ...base.items,
        { menuItemId: item.id, name: item.name, price: item.price, isVeg: item.isVeg, quantity: 1 },
      ];

  return { restaurant, items };
}

// Sets an item's quantity. Zero (or less) removes it; an empty cart forgets its restaurant.
export function setQuantity(cart: Cart, menuItemId: string, quantity: number): Cart {
  const items = cart.items
    .map((line) =>
      line.menuItemId === menuItemId
        ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
        : line,
    )
    .filter((line) => line.quantity > 0);

  return items.length === 0 ? EMPTY_CART : { restaurant: cart.restaurant, items };
}

// ---- Reading saved data safely ---------------------------------------------

// Anything in localStorage could be old or edited by hand, so check its shape.
export function parseCart(raw: string | null): Cart {
  if (!raw) return EMPTY_CART;

  try {
    const data = JSON.parse(raw) as Partial<Cart>;
    const restaurant = data.restaurant;
    if (
      !restaurant ||
      typeof restaurant.id !== "string" ||
      typeof restaurant.slug !== "string" ||
      typeof restaurant.name !== "string" ||
      typeof restaurant.deliveryFee !== "number" ||
      typeof restaurant.minOrderAmount !== "number" ||
      !Array.isArray(data.items)
    ) {
      return EMPTY_CART;
    }

    const items = data.items.filter(
      (item): item is CartItem =>
        typeof item?.menuItemId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.isVeg === "boolean" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= MAX_QUANTITY_PER_ITEM,
    );

    return items.length === 0 ? EMPTY_CART : { restaurant, items };
  } catch {
    return EMPTY_CART;
  }
}
