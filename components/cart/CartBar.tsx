"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";

// Floating cart bar at the bottom of a restaurant page on phones (v2 6a): dark bar with the
// count and total, saffron "View cart →". Laptops show the cart beside the menu instead.
export function CartBar({ restaurantId }: { restaurantId: string }) {
  const { cart, count, subtotal } = useCart();

  // Only show it on the page of the restaurant the cart belongs to.
  if (count === 0 || cart.restaurant?.id !== restaurantId) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-4 pb-6 lg:hidden">
      <Link
        href="/cart"
        className="mx-auto flex h-[60px] w-full max-w-3xl items-center justify-between rounded-2xl bg-[#16120D] pl-[18px] pr-2 text-white shadow-[0_12px_30px_rgba(0,0,0,.25)] dark:bg-[#2A241C]"
      >
        <span className="flex flex-col">
          <span className="text-xs text-[#D8D2C8]">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="font-bold tabular-nums">{formatPrice(subtotal)}</span>
        </span>
        <span className="flex h-11 items-center rounded-[11px] bg-brand px-[18px] font-bold text-on-brand">View cart →</span>
      </Link>
    </div>
  );
}
