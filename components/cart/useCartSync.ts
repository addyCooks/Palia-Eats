"use client";

import { useCallback, useEffect, useState } from "react";
import { syncCartWithServer } from "@/lib/cart/sync";
import { getCartSnapshot, saveCart } from "@/lib/cart/store";
import type { RestaurantStatus } from "@/lib/utils/hours";

// Compares the saved cart with the restaurant's live menu when a page opens:
// updates changed prices, removes sold-out items, and reports open/closed.
// Used by both the cart page and checkout.
export function useCartSync() {
  const [notices, setNotices] = useState<string[]>([]);
  const [status, setStatus] = useState<RestaurantStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const current = getCartSnapshot();
    const result = await syncCartWithServer(current);
    if (JSON.stringify(result.cart) !== JSON.stringify(current)) saveCart(result.cart);
    setNotices(result.notices);
    setStatus(result.status);
    setChecking(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the live menu once on arrival
    void refresh();
  }, [refresh]);

  return { notices, status, checking, refresh };
}
