"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_CART, toCartRestaurant, type Cart, type CartItem } from "@/lib/cart/cart";
import { getCartSnapshot, saveCart } from "@/lib/cart/store";
import type { Restaurant } from "@/types/app";

type PastLine = { menu_item_id: string | null; quantity: number; variant: "full" | "half" };

// "Reorder": puts the same dishes back in the cart at TODAY's prices (dishes that are sold
// out or gone are skipped), then opens the cart.
export function ReorderButton({ restaurantId, lines }: { restaurantId: string; lines: PastLine[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function reorder() {
    setBusy(true);
    setNote(null);
    const supabase = createClient();
    const ids = lines.map((line) => line.menu_item_id).filter((id): id is string => Boolean(id));
    const [{ data: restaurant }, { data: items }] = await Promise.all([
      supabase.from("restaurants").select("*").eq("id", restaurantId).eq("is_active", true).maybeSingle(),
      supabase.from("menu_items").select("id, name, price, half_price, is_veg, is_available").in("id", ids),
    ]);
    if (!restaurant) {
      setNote("This restaurant isn't available right now.");
      setBusy(false);
      return;
    }

    const live = new Map((items ?? []).map((item) => [item.id, item]));
    const cartItems: CartItem[] = [];
    for (const line of lines) {
      const item = line.menu_item_id ? live.get(line.menu_item_id) : undefined;
      if (!item || !item.is_available) continue;
      const price = line.variant === "half" ? item.half_price : item.price;
      if (price === null) continue;
      cartItems.push({
        menuItemId: item.id,
        name: item.name,
        price,
        isVeg: item.is_veg,
        quantity: Math.min(line.quantity, 20),
        variant: line.variant,
      });
    }

    if (cartItems.length === 0) {
      setNote("None of these dishes are available right now.");
      setBusy(false);
      return;
    }
    const current = getCartSnapshot();
    if (current.items.length > 0 && !window.confirm("Replace what's in your cart with this order?")) {
      setBusy(false);
      return;
    }
    const cart: Cart = { ...EMPTY_CART, restaurant: toCartRestaurant(restaurant as Restaurant), items: cartItems };
    saveCart(cart);
    router.push("/cart");
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={reorder}
        disabled={busy}
        className="flex h-10 shrink-0 items-center rounded-[10px] bg-[#16120D] px-[18px] text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-[#2A241C]"
      >
        {busy ? "Adding…" : "Reorder"}
      </button>
      {note && <span className="text-xs text-red-700">{note}</span>}
    </span>
  );
}
