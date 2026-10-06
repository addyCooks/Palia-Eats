"use client";

import { isOtherRestaurant, toCartRestaurant } from "@/lib/cart/cart";
import { useCart } from "@/components/cart/useCart";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import type { MenuItem, Restaurant } from "@/types/app";

type AddToCartButtonProps = {
  restaurant: Restaurant;
  item: MenuItem;
  // false when the restaurant is closed or has paused orders
  canOrder: boolean;
};

// Shows "Add"; once the item is in the cart it turns into a quantity stepper.
export function AddToCartButton({ restaurant, item, canOrder }: AddToCartButtonProps) {
  const { cart, addItem, changeQuantity } = useCart();
  const quantity = cart.items.find((line) => line.menuItemId === item.id)?.quantity ?? 0;

  if (!canOrder) {
    return <span className="text-xs font-medium text-stone-500">Ordering closed</span>;
  }

  if (quantity > 0) {
    return (
      <QuantityStepper
        quantity={quantity}
        itemName={item.name}
        onChange={(next) => changeQuantity(item.id, next)}
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
    addItem(toCartRestaurant(restaurant), {
      id: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.is_veg,
    });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="h-9 rounded-xl border border-brand px-6 text-sm font-semibold text-brand hover:bg-brand hover:text-on-brand"
    >
      Add
    </button>
  );
}
