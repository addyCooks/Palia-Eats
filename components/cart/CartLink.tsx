"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/useCart";

// "Cart" link with an item-count badge (used in the site header and storefronts).
export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      Cart
      {count > 0 && (
        <span className="flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
