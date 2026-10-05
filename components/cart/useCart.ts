"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_CART,
  addToCart,
  cartCount,
  cartSubtotal,
  cartTotal,
  setQuantity,
  type CartRestaurant,
} from "@/lib/cart/cart";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  saveCart,
  subscribeToCart,
} from "@/lib/cart/store";

type ItemToAdd = { id: string; name: string; price: number; isVeg: boolean };

// The one hook every cart component uses.
export function useCart() {
  const cart = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);

  const addItem = useCallback((restaurant: CartRestaurant, item: ItemToAdd) => {
    saveCart(addToCart(getCartSnapshot(), restaurant, item));
  }, []);

  const changeQuantity = useCallback((menuItemId: string, quantity: number) => {
    saveCart(setQuantity(getCartSnapshot(), menuItemId, quantity));
  }, []);

  const clearCart = useCallback(() => saveCart(EMPTY_CART), []);

  return {
    cart,
    count: cartCount(cart),
    subtotal: cartSubtotal(cart),
    total: cartTotal(cart),
    addItem,
    changeQuantity,
    clearCart,
  };
}
