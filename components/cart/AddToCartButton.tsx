"use client";

import { isOtherRestaurant, lineKey, toCartRestaurant } from "@/lib/cart/cart";
import { useCart } from "@/components/cart/useCart";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import type { MenuItem, Restaurant } from "@/types/app";

type AddToCartButtonProps = {
  restaurant: Restaurant;
  item: MenuItem;
  // false when the restaurant is closed or has paused orders
  canOrder: boolean;
  // Dishes with a half plate open the dish sheet so the customer can pick Half or Full.
  onChooseSize?: () => void;
};

// Shows "ADD"; once the item is in the cart it turns into a quantity stepper.
// Both fill the width of the plate they sit on.
export function AddToCartButton({ restaurant, item, canOrder, onChooseSize }: AddToCartButtonProps) {
  const { cart, addItem, changeQuantity } = useCart();
  const fullKey = lineKey({ menuItemId: item.id, variant: "full" });
  const inCart = cart.items.filter((line) => line.menuItemId === item.id);
  const total = inCart.reduce((sum, line) => sum + line.quantity, 0);

  if (!canOrder) {
    return (
      <span className="flex h-9 w-full items-center justify-center rounded-[9px] bg-surface/90 text-xs font-bold text-stone-600 shadow-sm">
        Ordering closed
      </span>
    );
  }

  // Half / full dishes: the sheet does the choosing; here we just show how many are in.
  if (item.half_price !== null && onChooseSize) {
    return (
      <button
        type="button"
        onClick={onChooseSize}
        aria-label={total > 0 ? `${total} ${item.name} in cart. Add more` : `Add ${item.name}`}
        className="h-9 w-full rounded-[9px] bg-brand text-[13px] font-bold tracking-wide text-on-brand shadow-saffron transition-colors hover:bg-brand-dark"
      >
        {total > 0 ? `${total} added +` : "ADD"}
      </button>
    );
  }

  const quantity = cart.items.find((line) => lineKey(line) === fullKey)?.quantity ?? 0;
  if (quantity > 0) {
    return (
      <QuantityStepper
        variant="solid"
        quantity={quantity}
        itemName={item.name}
        className="h-9 w-full shadow-saffron"
        onChange={(next) => changeQuantity(fullKey, next)}
      />
    );
  }

  function handleAdd() {
    // One restaurant per cart: ask before throwing the old cart away.
    if (isOtherRestaurant(cart, restaurant.id)) {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurant?.name}. Start a new cart with ${restaurant.name}?`,
      );
      if (!ok) return;
    }
    addItem(toCartRestaurant(restaurant), { id: item.id, name: item.name, price: item.price, isVeg: item.is_veg });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Add ${item.name}`}
      className="h-9 w-full rounded-[9px] bg-brand text-[13px] font-bold tracking-wide text-on-brand shadow-saffron transition-colors hover:bg-brand-dark"
    >
      ADD
    </button>
  );
}
