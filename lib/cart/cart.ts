import type { Restaurant } from "@/types/app";

// ---- Types -----------------------------------------------------------------
// The cart is kept in the visitor's browser. Prices here are for DISPLAY only:
// at checkout the server re-reads real prices from the database.

export type PlateSize = "full" | "half";

export type CartItem = {
  menuItemId: string;
  name: string; // the dish name, without "(Half)"
  price: number; // the price of THIS plate size
  isVeg: boolean;
  quantity: number;
  variant: PlateSize;
};

// A dish can be in the cart twice: once as a full plate and once as a half plate.
export const lineKey = (line: { menuItemId: string; variant: PlateSize }) => `${line.menuItemId}:${line.variant}`;

export const lineName = (line: { name: string; variant: PlateSize }) =>
  line.variant === "half" ? `${line.name} (Half)` : line.name;

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

// Adds one plate of an item. If the cart belongs to another restaurant it is replaced,
// so ask the visitor first (see AddToCartButton).
export function addToCart(
  cart: Cart,
  restaurant: CartRestaurant,
  item: { id: string; name: string; price: number; isVeg: boolean; variant?: PlateSize },
): Cart {
  const base: Cart = isOtherRestaurant(cart, restaurant.id) ? EMPTY_CART : cart;
  const variant: PlateSize = item.variant ?? "full";
  const key = lineKey({ menuItemId: item.id, variant });
  const existing = base.items.find((line) => lineKey(line) === key);

  const items = existing
    ? base.items.map((line) =>
        lineKey(line) === key ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY_PER_ITEM) } : line,
      )
    : [
        ...base.items,
        { menuItemId: item.id, name: item.name, price: item.price, isVeg: item.isVeg, quantity: 1, variant },
      ];

  return { restaurant, items };
}

// Sets a line's quantity (key from lineKey). Zero removes it; an empty cart forgets its restaurant.
export function setQuantity(cart: Cart, key: string, quantity: number): Cart {
  const items = cart.items
    .map((line) => (lineKey(line) === key ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) } : line))
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

    const items = (data.items as unknown[])
      // Carts saved before half plates existed have no variant: those are full plates.
      .map((item) =>
        item && typeof item === "object" && !("variant" in item) ? { ...(item as object), variant: "full" } : item,
      )
      .filter((item): item is CartItem => {
        const line = item as Partial<CartItem> | null;
        return (
          typeof line?.menuItemId === "string" &&
          typeof line.name === "string" &&
          typeof line.price === "number" &&
          typeof line.isVeg === "boolean" &&
          (line.variant === "full" || line.variant === "half") &&
          Number.isInteger(line.quantity) &&
          (line.quantity ?? 0) > 0 &&
          (line.quantity ?? 0) <= MAX_QUANTITY_PER_ITEM
        );
      });

    return items.length === 0 ? EMPTY_CART : { restaurant, items };
  } catch {
    return EMPTY_CART;
  }
}
