"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";

// Floating "View cart" bar at the bottom of a restaurant page.
export function CartBar({ restaurantId }: { restaurantId: string }) {
  const { cart, count, subtotal } = useCart();

  // Only show it on the page of the restaurant the cart belongs to.
  if (count === 0 || cart.restaurant?.id !== restaurantId) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 p-4">
      <Link
        href="/cart"
        className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl bg-brand px-5 py-4 font-semibold text-on-brand shadow-lg hover:bg-brand-dark"
      >
        <span>
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span>View cart · {formatPrice(subtotal)}</span>
      </Link>
    </div>
  );
}
